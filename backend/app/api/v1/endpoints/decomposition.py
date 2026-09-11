import json
import logging
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import Project, Epic, Task, TaskDependency, User, UserSkill
from app.services.decomposer import (
    decompose_project_idea,
    match_best_assignee,
    split_task_in_dag,
    detect_project_domain,
    calculate_dag_metrics,
)
from app.services.embeddings import compute_deterministic_embedding
from app.services.ws_manager import ws_manager
from app.services.ai_provider import generate_decomposition_with_ai

logger = logging.getLogger("daedalus.api.decomposer")
router = APIRouter()


class DecomposeRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=2000, json_schema_extra={"example": "Daedalus Hackathon Engine"})
    description: str = Field(..., min_length=5, max_length=50000, json_schema_extra={"example": "Autonomous multi-agent orchestration platform for hackathons"})
    team_user_ids: Optional[List[str]] = None
    squad_id: Optional[str] = None
    squad_name: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    required_skills: Optional[str] = None
    api_route_spec: Optional[dict] = None


class TaskSplitRequest(BaseModel):
    strategy: str = Field(
        default="frontend_backend",
        description="Splitting architecture: frontend_backend, logic_testing, parallel_micro, or custom"
    )
    custom_subtasks: Optional[List[dict]] = None


class TaskCreateRequest(BaseModel):
    epic_id: str
    title: str
    description: str
    required_skills: str
    depends_on: Optional[List[str]] = []
    api_route_spec: Optional[dict] = None


@router.post("/decompose", response_model=dict)
async def decompose_project(
    req: DecomposeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Parses ANY raw project idea. If user supplied BYOK credentials (Gemini, OpenAI, Claude),
    executes real LLM prompt decomposition. Falls back to deterministic multi-domain engine.
    """
    # 1. Fetch available users for skill matching (strictly within squad if team_user_ids provided)
    users_result = await db.execute(select(User))
    all_users = users_result.scalars().all()

    candidate_users = []
    if req.team_user_ids and len(req.team_user_ids) > 0:
        id_set = set(req.team_user_ids)
        candidate_users = [
            u for u in all_users
            if u.id in id_set or u.github_username in id_set
        ]
        if not candidate_users:
            raise HTTPException(
                status_code=400,
                detail=f"None of the specified squad member IDs ({req.team_user_ids}) were found in the database."
            )
    else:
        candidate_users = list(all_users)

    user_skill_profiles = []
    for u in candidate_users:
        user_skill_profiles.append({
            "id": u.id,
            "name": u.full_name,
            "skills": [{"embedding": s.embedding, "text": s.raw_skill_text} for s in u.skills]
        })

    # 2. Check for BYOK Headers
    byok_provider = request.headers.get("x-byok-provider")
    byok_key = request.headers.get("x-byok-key")
    byok_model = request.headers.get("x-byok-model")

    decomposition = None
    if byok_provider and byok_key:
        logger.info(f"Attempting BYOK AI decomposition with provider: {byok_provider}")
        decomposition = await generate_decomposition_with_ai(
            title=req.title,
            description=req.description,
            provider=byok_provider,
            api_key=byok_key,
            model=byok_model
        )

    # Fallback to resilient deterministic engine if BYOK absent or failed
    if not decomposition:
        decomposition = decompose_project_idea(req.title, req.description)

    # 3. Create Project record with squad binding
    squad_member_ids_json = json.dumps([u.id for u in candidate_users]) if candidate_users else None
    project = Project(
        title=req.title,
        description=req.description,
        squad_id=req.squad_id,
        squad_name=req.squad_name,
        squad_member_ids=squad_member_ids_json
    )
    db.add(project)
    await db.flush()

    task_code_to_id = {}
    tasks_to_create = []

    # 4. Create Epics and Tasks
    for epic_data in decomposition["epics"]:
        epic = Epic(
            project_id=project.id,
            title=epic_data["title"],
            description=epic_data["description"],
            order_index=epic_data["order_index"]
        )
        db.add(epic)
        await db.flush()

        for t_data in epic_data["tasks"]:
            # Find best assignee via vector embeddings
            assignee_id = match_best_assignee(t_data["required_skills"], user_skill_profiles)

            # Compute task embedding
            t_embedding = compute_deterministic_embedding(t_data["required_skills"])

            task = Task(
                epic_id=epic.id,
                task_code=t_data["task_code"],
                title=t_data["title"],
                description=t_data["description"],
                required_skills_text=t_data["required_skills"],
                skill_embedding=t_embedding,
                assignee_id=assignee_id,
                api_route_spec=json.dumps(t_data["api_route_spec"]) if t_data.get("api_route_spec") else None,
                status="TODO" if not t_data["depends_on"] else "BLOCKED",
                ci_status="PENDING"
            )
            db.add(task)
            await db.flush()
            task_code_to_id[t_data["task_code"]] = task.id
            tasks_to_create.append((task, t_data["depends_on"]))

    # 5. Create Task Dependencies
    for task_obj, prereq_codes in tasks_to_create:
        for prereq_code in prereq_codes:
            prereq_id = task_code_to_id.get(prereq_code)
            if prereq_id:
                dep = TaskDependency(
                    task_id=task_obj.id,
                    depends_on_task_id=prereq_id
                )
                db.add(dep)

    await db.commit()
    await db.refresh(project)

    # Broadcast event to UI
    await ws_manager.broadcast("DECOMPOSITION_COMPLETED", {
        "project_id": project.id,
        "title": project.title,
        "domain": decomposition.get("domain", "general"),
        "task_count": len(tasks_to_create)
    })

    return await get_project_roadmap(project.id, db)


@router.get("/{project_id}", response_model=dict)
async def get_project_roadmap(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetches complete project roadmap with epics, tasks, assignees, and DAG edges."""
    db.expire_all()
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    epics_out = []
    all_tasks = []
    edges = []
    task_dicts_for_metrics = []
    deps_for_metrics = []

    for epic in project.epics:
        tasks_out = []
        for task in epic.tasks:
            spec = json.loads(task.api_route_spec) if task.api_route_spec else None
            upstream_ids = [dep.depends_on_task_id for dep in task.upstream_dependencies]

            task_dict = {
                "id": task.id,
                "epic_id": task.epic_id,
                "task_code": task.task_code,
                "title": task.title,
                "description": task.description,
                "required_skills": task.required_skills_text,
                "status": task.status,
                "ci_status": task.ci_status,
                "branch_name": task.branch_name,
                "pr_number": task.pr_number,
                "last_commit_hash": task.last_commit_hash,
                "last_commit_message": task.last_commit_message,
                "api_route_spec": spec,
                "assignee": {
                    "id": task.assignee.id,
                    "name": task.assignee.full_name,
                    "github_username": task.assignee.github_username,
                    "avatar_url": task.assignee.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={task.assignee.github_username}",
                    "timezone": task.assignee.timezone,
                    "active_branch": task.assignee.active_branch
                } if task.assignee else None,
                "depends_on": upstream_ids
            }
            tasks_out.append(task_dict)
            all_tasks.append(task_dict)
            task_dicts_for_metrics.append({"task_code": task.task_code})

            for dep in task.upstream_dependencies:
                edges.append({
                    "id": f"{dep.depends_on_task_id}-{task.id}",
                    "source": dep.depends_on_task_id,
                    "target": task.id
                })
                # Find prereq task_code
                prereq_result = await db.execute(select(Task.task_code).where(Task.id == dep.depends_on_task_id))
                prereq_code = prereq_result.scalar_one_or_none()
                if prereq_code:
                    deps_for_metrics.append((task.task_code, prereq_code))

        epics_out.append({
            "id": epic.id,
            "title": epic.title,
            "description": epic.description,
            "order_index": epic.order_index,
            "tasks": tasks_out
        })

    # Calculate metrics
    metrics = calculate_dag_metrics(task_dicts_for_metrics, deps_for_metrics)
    domain = detect_project_domain(project.title, project.description)

    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "github_repo": project.github_repo,
        "domain": domain,
        "metrics": metrics,
        "created_at": project.created_at.isoformat(),
        "epics": epics_out,
        "tasks": all_tasks,
        "edges": edges,
        "squad_id": project.squad_id,
        "squad_name": project.squad_name,
        "squad_member_ids": json.loads(project.squad_member_ids) if project.squad_member_ids else []
    }


@router.post("/tasks/{task_id}/split", response_model=dict)
async def split_task(
    task_id: str,
    req: TaskSplitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Splits an existing task into parallel child tasks, re-wires upstream and downstream
    DAG dependencies, matches assignees using vector embeddings, and updates roadmap.
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    epic_id = task.epic_id
    epic_result = await db.execute(select(Epic).where(Epic.id == epic_id))
    epic = epic_result.scalar_one()
    project_id = epic.project_id

    # Upstream and downstream dependencies of original task
    upstream_deps = [dep.depends_on_task_id for dep in task.upstream_dependencies]
    downstream_deps = [dep.task_id for dep in task.downstream_dependencies]

    # Available users for vector matching (strictly within project squad if bound)
    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    parent_project = proj_res.scalar_one_or_none()
    squad_member_ids = []
    if parent_project and parent_project.squad_member_ids:
        try:
            squad_member_ids = json.loads(parent_project.squad_member_ids)
        except Exception:
            squad_member_ids = []

    users_result = await db.execute(select(User))
    all_users = users_result.scalars().all()

    if squad_member_ids:
        squad_set = set(squad_member_ids)
        candidate_users = [u for u in all_users if u.id in squad_set or u.github_username in squad_set]
        if not candidate_users:
            candidate_users = list(all_users)
    else:
        candidate_users = list(all_users)

    user_skill_profiles = [
        {
            "id": u.id,
            "name": u.full_name,
            "skills": [{"embedding": s.embedding, "text": s.raw_skill_text} for s in u.skills]
        }
        for u in candidate_users
    ]

    original_dict = {
        "task_code": task.task_code,
        "title": task.title,
        "description": task.description,
        "required_skills": task.required_skills_text,
        "api_route_spec": json.loads(task.api_route_spec) if task.api_route_spec else None,
        "depends_on": upstream_deps
    }

    subtask_specs = split_task_in_dag(original_dict, req.strategy, req.custom_subtasks)
    created_subtasks = []

    # Create new subtasks
    for spec in subtask_specs:
        assignee_id = match_best_assignee(spec["required_skills"], user_skill_profiles)
        t_embedding = compute_deterministic_embedding(spec["required_skills"])

        new_task = Task(
            epic_id=epic_id,
            task_code=spec["task_code"],
            title=spec["title"],
            description=spec["description"],
            required_skills_text=spec["required_skills"],
            skill_embedding=t_embedding,
            assignee_id=assignee_id,
            api_route_spec=json.dumps(spec["api_route_spec"]) if spec.get("api_route_spec") else None,
            status="TODO" if (not upstream_deps and not spec.get("depends_on")) else "BLOCKED",
            ci_status="PENDING"
        )
        db.add(new_task)
        await db.flush()
        created_subtasks.append((new_task, spec.get("depends_on", [])))

    # Wire dependencies:
    # 1. New subtasks inherit original task's upstream dependencies
    for new_task_obj, internal_prereq_codes in created_subtasks:
        for up_id in upstream_deps:
            db.add(TaskDependency(task_id=new_task_obj.id, depends_on_task_id=up_id))

        # Wire internal dependencies (e.g. subtask b depends on subtask a)
        for prereq_code in internal_prereq_codes:
            for other_sub, _ in created_subtasks:
                if other_sub.task_code == prereq_code:
                    db.add(TaskDependency(task_id=new_task_obj.id, depends_on_task_id=other_sub.id))

    # 2. Downstream tasks now depend on all created subtasks
    terminal_subtask_ids = [sub.id for sub, _ in created_subtasks]
    for down_id in downstream_deps:
        for term_id in terminal_subtask_ids:
            db.add(TaskDependency(task_id=down_id, depends_on_task_id=term_id))

    # Delete original task
    await db.delete(task)
    await db.commit()

    # Broadcast event via WebSocket
    await ws_manager.broadcast("TASK_SPLIT", {
        "project_id": project_id,
        "original_task_code": task.task_code,
        "new_subtask_codes": [s.task_code for s, _ in created_subtasks]
    })

    return await get_project_roadmap(project_id, db)


@router.post("/{project_id}/tasks", response_model=dict)
async def create_custom_task(
    project_id: str,
    req: TaskCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Creates a custom task in the specified epic and updates the DAG."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Generate custom task code
    task_count_res = await db.execute(select(Task))
    task_count = len(task_count_res.scalars().all())
    code = f"TASK-{task_count + 1:02d}"

    # Match user (strictly within squad if bound)
    squad_member_ids = []
    if project.squad_member_ids:
        try:
            squad_member_ids = json.loads(project.squad_member_ids)
        except Exception:
            squad_member_ids = []

    users_result = await db.execute(select(User))
    all_users = users_result.scalars().all()
    if squad_member_ids:
        squad_set = set(squad_member_ids)
        candidate_users = [u for u in all_users if u.id in squad_set or u.github_username in squad_set]
        if not candidate_users:
            candidate_users = list(all_users)
    else:
        candidate_users = list(all_users)

    user_skill_profiles = [
        {"id": u.id, "name": u.full_name, "skills": [{"embedding": s.embedding, "text": s.raw_skill_text} for s in u.skills]}
        for u in candidate_users
    ]
    assignee_id = match_best_assignee(req.required_skills, user_skill_profiles)
    t_embedding = compute_deterministic_embedding(req.required_skills)

    new_task = Task(
        epic_id=req.epic_id,
        task_code=code,
        title=req.title,
        description=req.description,
        required_skills_text=req.required_skills,
        skill_embedding=t_embedding,
        assignee_id=assignee_id,
        api_route_spec=json.dumps(req.api_route_spec) if req.api_route_spec else None,
        status="TODO" if not req.depends_on else "BLOCKED",
        ci_status="PENDING"
    )
    db.add(new_task)
    await db.flush()

    if req.depends_on:
        for dep_id in req.depends_on:
            db.add(TaskDependency(task_id=new_task.id, depends_on_task_id=dep_id))
        await db.flush()

        # Validate DAG acyclicity across all project tasks
        tasks_res = await db.execute(
            select(Task).join(Epic).where(Epic.project_id == project_id)
        )
        proj_tasks = tasks_res.scalars().all()
        task_id_to_code = {t.id: t.task_code for t in proj_tasks}
        task_codes_list = [{"task_code": t.task_code} for t in proj_tasks]

        deps_res = await db.execute(
            select(TaskDependency).where(TaskDependency.task_id.in_([t.id for t in proj_tasks]))
        )
        all_deps = deps_res.scalars().all()
        dep_tuples = [
            (task_id_to_code[d.task_id], task_id_to_code[d.depends_on_task_id])
            for d in all_deps
            if d.task_id in task_id_to_code and d.depends_on_task_id in task_id_to_code
        ]
        try:
            validate_dag(task_codes_list, dep_tuples)
        except DAGCycleException as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    await db.commit()

    await ws_manager.broadcast("TASK_CREATED", {
        "project_id": project_id,
        "task_id": new_task.id,
        "task_code": new_task.task_code,
        "title": new_task.title
    })

    return await get_project_roadmap(project_id, db)


@router.delete("/tasks/{task_id}", response_model=dict)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Deletes a task and repairs downstream dependencies."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    epic_res = await db.execute(select(Epic).where(Epic.id == task.epic_id))
    epic = epic_res.scalar_one()
    project_id = epic.project_id

    # Bridge upstream to downstream
    upstream_ids = [dep.depends_on_task_id for dep in task.upstream_dependencies]
    downstream_ids = [dep.task_id for dep in task.downstream_dependencies]

    for down_id in downstream_ids:
        for up_id in upstream_ids:
            # Check if exists
            exists = await db.execute(
                select(TaskDependency).where(
                    TaskDependency.task_id == down_id,
                    TaskDependency.depends_on_task_id == up_id
                )
            )
            if not exists.scalar_one_or_none():
                db.add(TaskDependency(task_id=down_id, depends_on_task_id=up_id))

    await db.delete(task)
    await db.commit()

    await ws_manager.broadcast("TASK_DELETED", {
        "project_id": project_id,
        "task_id": task_id
    })

    return {"status": "success", "deleted_task_id": task_id}


@router.patch("/tasks/{task_id}", response_model=dict)
async def update_task(
    task_id: str,
    req: TaskUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update task details, assignee, status, or mock API route spec."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.title is not None:
        task.title = req.title
    if req.description is not None:
        task.description = req.description
    if req.status is not None:
        task.status = req.status
    if req.assignee_id is not None:
        task.assignee_id = req.assignee_id
    if req.required_skills is not None:
        task.required_skills_text = req.required_skills
        task.skill_embedding = compute_deterministic_embedding(req.required_skills)
    if req.api_route_spec is not None:
        task.api_route_spec = json.dumps(req.api_route_spec)

    await db.commit()
    await db.refresh(task)

    await ws_manager.broadcast("TASK_UPDATED", {
        "task_id": task.id,
        "task_code": task.task_code,
        "status": task.status,
        "title": task.title
    })

    return {"status": "success", "task_id": task.id}


class ProjectRepoUpdateRequest(BaseModel):
    github_repo: str = Field(..., description="Repository URL or owner/repo format (e.g. 'octocat/my-app')")


@router.patch("/{project_id}/repo", response_model=dict)
async def update_project_repository(
    project_id: str,
    req: ProjectRepoUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Connects or updates the GitHub repository (owner/repo) for automated webhook tracking.
    Cleans URLs like 'https://github.com/owner/repo.git' into 'owner/repo'.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    raw = req.github_repo.strip()
    # Normalize repo format (extract owner/repo)
    clean = re.sub(r"^https?://github\.com/", "", raw)
    clean = re.sub(r"^git@github\.com:", "", clean)
    clean = clean.removesuffix(".git").strip("/")

    project.github_repo = clean
    await db.commit()
    await db.refresh(project)

    await ws_manager.broadcast("PROJECT_REPO_UPDATED", {
        "project_id": project.id,
        "github_repo": project.github_repo
    })

    return {
        "status": "success",
        "project_id": project.id,
        "github_repo": project.github_repo
    }


