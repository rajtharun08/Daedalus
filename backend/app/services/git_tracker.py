import logging
import re
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Task, TaskStatus, CIStatus, TaskDependency, Project, Epic
from app.services.ws_manager import ws_manager

logger = logging.getLogger("daedalus.git_tracker")

TASK_REF_REGEX = re.compile(r"(?i)(?:close|closes|fix|fixes|ref|refs|feat|task)[\s:#]+([A-Za-z0-9_-]+)")


async def process_git_event(
    event_type: str,
    payload: dict,
    db: AsyncSession
) -> Dict[str, any]:
    """
    Processes a GitHub webhook event and updates the task graph state machine.
    """
    result = {
        "event_type": event_type,
        "tasks_updated": [],
        "ci_status": None,
        "completed_task": None
    }

    # Extract repository metadata if provided in GitHub webhook payload
    repo_full_name = payload.get("repository", {}).get("full_name")

    # 1. Handle Push event
    if event_type == "push":
        commits = payload.get("commits", [])
        ref = payload.get("ref", "")  # e.g., "refs/heads/task/CORE-01"
        branch_name = ref.replace("refs/heads/", "") if ref else ""

        for commit in commits:
            msg = commit.get("message", "")
            commit_id = commit.get("id", "")[:7]
            matches = TASK_REF_REGEX.findall(msg)
            
            # Also check if branch name has task code
            branch_match = re.search(r"([A-Za-z]+-[0-9]+)", branch_name)
            if branch_match:
                matches.append(branch_match.group(1))

            for task_code in set(matches):
                task = await _find_task_by_code(task_code.upper(), db, repo_name=repo_full_name)
                if task:
                    task.branch_name = branch_name
                    task.last_commit_hash = commit_id
                    task.last_commit_message = msg[:200]
                    if task.status in [TaskStatus.TODO.value, TaskStatus.BACKLOG.value]:
                        task.status = TaskStatus.IN_PROGRESS.value

                    result["tasks_updated"].append(task.task_code)
                    await db.commit()

                    await ws_manager.broadcast("TASK_UPDATED", {
                        "task_id": task.id,
                        "task_code": task.task_code,
                        "status": task.status,
                        "ci_status": task.ci_status,
                        "last_commit_hash": task.last_commit_hash,
                        "last_commit_message": task.last_commit_message,
                    })

    # 2. Handle Pull Request event
    elif event_type == "pull_request":
        action = payload.get("action")
        pr = payload.get("pull_request", {})
        title = pr.get("title", "")
        body = pr.get("body", "") or ""
        head_ref = pr.get("head", {}).get("ref", "")
        pr_number = pr.get("number")

        combined = f"{title} {body} {head_ref}"
        matches = TASK_REF_REGEX.findall(combined)

        for task_code in set(matches):
            task = await _find_task_by_code(task_code.upper(), db, repo_name=repo_full_name)
            if task:
                task.pr_number = pr_number
                task.branch_name = head_ref
                if action in ["opened", "reopened", "synchronize"]:
                    task.status = TaskStatus.IN_REVIEW.value
                    task.ci_status = CIStatus.PENDING.value

                result["tasks_updated"].append(task.task_code)
                await db.commit()

                await ws_manager.broadcast("TASK_UPDATED", {
                    "task_id": task.id,
                    "task_code": task.task_code,
                    "status": task.status,
                    "ci_status": task.ci_status,
                    "pr_number": task.pr_number,
                })

    # 3. Handle Check Run / CI Run event (GitHub Actions)
    elif event_type in ["check_run", "workflow_run"]:
        check_run = payload.get("check_run") or payload.get("workflow_run", {})
        status = check_run.get("status")  # "queued", "in_progress", "completed"
        conclusion = check_run.get("conclusion")  # "success", "failure", "cancelled"
        head_branch = check_run.get("head_branch", "")
        check_name = check_run.get("name", "CI Verification")

        # Find task code in branch name or check summary
        task_code_match = re.search(r"([A-Za-z]+-[0-9]+)", head_branch)
        if task_code_match:
            task_code = task_code_match.group(1).upper()
            task = await _find_task_by_code(task_code, db, repo_name=repo_full_name)
            if task:
                if status == "in_progress":
                    task.ci_status = CIStatus.RUNNING.value
                elif status == "completed":
                    if conclusion == "success":
                        task.ci_status = CIStatus.PASSED.value
                        task.status = TaskStatus.COMPLETED.value
                        result["completed_task"] = task.task_code

                        # Unlock downstream dependent tasks if their prerequisites are all complete
                        await _check_and_unlock_dependents(task, db)
                    else:
                        task.ci_status = CIStatus.FAILED.value

                result["tasks_updated"].append(task.task_code)
                await db.commit()

                # Broadcast CI Pass & Task Completion
                await ws_manager.broadcast("CI_PASSED" if task.ci_status == CIStatus.PASSED.value else "TASK_UPDATED", {
                    "task_id": task.id,
                    "task_code": task.task_code,
                    "status": task.status,
                    "ci_status": task.ci_status,
                    "conclusion": conclusion,
                })

    return result


async def _find_task_by_code(
    task_code: str,
    db: AsyncSession,
    repo_name: Optional[str] = None
) -> Optional[Task]:
    # 1. If repo_name is provided, prioritize tasks belonging to the project linked to that repo
    if repo_name:
        clean_repo = repo_name.strip().lower()
        stmt = (
            select(Task)
            .join(Epic, Task.epic_id == Epic.id)
            .join(Project, Epic.project_id == Project.id)
            .where(Task.task_code == task_code)
            .where(Project.github_repo.ilike(clean_repo))
            .order_by(Task.updated_at.desc())
        )
        task_match = (await db.execute(stmt)).scalars().first()
        if task_match:
            return task_match

    # 2. Otherwise find by task_code (and auto-bind project.github_repo if repo_name is present and unset)
    result = await db.execute(
        select(Task).where(Task.task_code == task_code).order_by(Task.updated_at.desc())
    )
    task = result.scalars().first()
    if task and repo_name:
        # Auto-bind repo to project if not yet linked
        epic_result = await db.execute(select(Epic).where(Epic.id == task.epic_id))
        epic = epic_result.scalar_one_or_none()
        if epic:
            proj_result = await db.execute(select(Project).where(Project.id == epic.project_id))
            proj = proj_result.scalar_one_or_none()
            if proj and not proj.github_repo:
                proj.github_repo = repo_name.strip()
                logger.info(f"Auto-bound GitHub repository '{repo_name}' to project '{proj.title}' (ID: {proj.id})")
                await db.flush()
                await ws_manager.broadcast("PROJECT_REPO_UPDATED", {
                    "project_id": proj.id,
                    "github_repo": proj.github_repo
                })

    return task


async def _check_and_unlock_dependents(completed_task: Task, db: AsyncSession):
    """
    Checks all tasks that depend on this completed task.
    If all prerequisites are now completed, updates task status from BLOCKED to TODO.
    """
    result = await db.execute(
        select(TaskDependency).where(TaskDependency.depends_on_task_id == completed_task.id)
    )
    edges = result.scalars().all()

    for edge in edges:
        downstream_result = await db.execute(select(Task).where(Task.id == edge.task_id))
        downstream_task = downstream_result.scalar_one_or_none()
        if downstream_task and downstream_task.status == TaskStatus.BLOCKED.value:
            # Check if all upstream tasks are completed
            prereq_result = await db.execute(
                select(TaskDependency).where(TaskDependency.task_id == downstream_task.id)
            )
            prereqs = prereq_result.scalars().all()
            all_done = True
            for p in prereqs:
                p_task = (await db.execute(select(Task).where(Task.id == p.depends_on_task_id))).scalar_one_or_none()
                if not p_task or p_task.status != TaskStatus.COMPLETED.value:
                    all_done = False
                    break
            
            if all_done:
                downstream_task.status = TaskStatus.TODO.value
                await ws_manager.broadcast("TASK_UPDATED", {
                    "task_id": downstream_task.id,
                    "task_code": downstream_task.task_code,
                    "status": downstream_task.status,
                    "unlocked": True
                })
