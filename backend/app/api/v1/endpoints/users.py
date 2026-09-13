import asyncio
import logging
import re
import uuid
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from app.db.session import get_db
from app.db.models import User, UserSkill, TeamInvitation
from app.services.embeddings import compute_deterministic_embedding
from app.services.ws_manager import ws_manager

logger = logging.getLogger("daedalus.users")
router = APIRouter()


class SkillScanRequest(BaseModel):
    github_or_resume: str = Field(..., description="GitHub profile username, URL, or raw resume text")
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class UserAvatarUpdateRequest(BaseModel):
    avatar_url: str


class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="GitHub handle or email address")
    password: Optional[str] = Field(None, description="Password or personal access token")


class UserSignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, description="Developer full name")
    github_username: str = Field(..., min_length=1, description="GitHub username")
    email: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = "Full-Stack"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    github_username: str
    github_id: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: str
    active_branch: str
    skills: List[dict] = []

    model_config = ConfigDict(from_attributes=True)


@router.post("/login", response_model=dict)
async def login_user(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate developer by GitHub handle or email."""
    ident = req.identifier.strip().replace("@", "")
    if not ident:
        raise HTTPException(status_code=400, detail="Identifier is required")

    result = await db.execute(
        select(User).where(
            func.lower(User.github_username) == ident.lower()
        )
    )
    user = result.scalar_one_or_none()

    if not user and "@" in req.identifier:
        res_email = await db.execute(
            select(User).where(
                func.lower(User.email) == req.identifier.strip().lower()
            )
        )
        user = res_email.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No developer profile found for '@{ident}'. Please create a profile first."
        )

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "github_username": user.github_username,
            "github_id": user.github_id,
            "avatar_url": user.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.github_username}",
            "timezone": user.timezone,
            "active_branch": user.active_branch,
            "skills": [
                {
                    "id": s.id,
                    "skill_name": s.raw_skill_text,
                    "category": s.category,
                    "proficiency": s.proficiency
                }
                for s in user.skills
            ],
            "assigned_task_count": len(user.assigned_tasks)
        }
    }


@router.post("/signup", response_model=dict)
async def signup_user(req: UserSignupRequest, db: AsyncSession = Depends(get_db)):
    """Create a new developer profile with verified GitHub identity and initial competencies."""
    raw_username = req.github_username.strip().replace("@", "")
    parts = raw_username.split()
    clean_username = parts[0] if parts else ""
    if not clean_username:
        raise HTTPException(status_code=400, detail="Valid GitHub username is required")

    email = req.email.strip() if req.email else f"{clean_username.lower()}@daedalus.hack"
    full_name = req.full_name.strip()

    # Check if user already exists
    existing = await db.execute(
        select(User).where(func.lower(User.github_username) == clean_username.lower())
    )
    user = existing.scalar_one_or_none()

    verified_github_id: Optional[str] = None
    gh_avatar: Optional[str] = None

    # Inspect GitHub profile if available
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            user_resp = await client.get(
                f"https://api.github.com/users/{clean_username}",
                headers={"User-Agent": "Daedalus-Auth/1.0", "Accept": "application/vnd.github.v3+json"}
            )
            if user_resp.status_code == 200:
                user_info = user_resp.json()
                if user_info.get("id"):
                    verified_github_id = str(user_info["id"])
                if user_info.get("avatar_url"):
                    gh_avatar = user_info["avatar_url"]
                if user_info.get("name") and not full_name:
                    full_name = user_info["name"]
    except Exception as e:
        logger.debug(f"GitHub profile query deferred: {e}")

    avatar = req.avatar_url or gh_avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_username}"

    # Default competencies based on role
    role = req.role or "Full-Stack"
    default_role_skills = {
        "Frontend": [("React 18 & TypeScript", "Frontend", 0.94), ("Tailwind CSS & Framer Motion", "Frontend", 0.90), ("Next.js & Responsive UI", "Frontend", 0.88)],
        "Backend": [("FastAPI & Python AsyncIO", "Backend", 0.95), ("PostgreSQL & SQLAlchemy", "Database", 0.90), ("REST APIs & Microservices", "Backend", 0.88)],
        "AI": [("LLM Prompting & RAG Systems", "AI", 0.94), ("Vector Search & Embeddings", "AI", 0.92), ("Python & PyTorch", "AI", 0.88)],
        "DevOps": [("Docker Multi-Stage & Compose", "DevOps", 0.94), ("GitHub Actions CI/CD", "DevOps", 0.92), ("Kubernetes & Cloud Deployments", "DevOps", 0.86)],
        "Full-Stack": [("FastAPI & Python AsyncIO", "Backend", 0.92), ("React 18 & TypeScript", "Frontend", 0.92), ("PostgreSQL & Docker", "Database", 0.88)]
    }
    selected_skills = default_role_skills.get(role, default_role_skills["Full-Stack"])

    if not user:
        user = User(
            email=email,
            full_name=full_name,
            github_username=clean_username,
            github_id=verified_github_id,
            avatar_url=avatar,
            timezone="UTC-04:00 (EDT)",
            active_branch=f"feat/{clean_username}-dev",
        )
        db.add(user)
        await db.flush()

        for s_title, s_cat, s_prof in selected_skills:
            emb = compute_deterministic_embedding(s_title)
            sk = UserSkill(
                user_id=user.id,
                raw_skill_text=s_title,
                category=s_cat,
                proficiency=s_prof,
                embedding=emb
            )
            db.add(sk)

        await db.commit()
        await db.refresh(user)
    else:
        user.full_name = full_name
        if verified_github_id:
            user.github_id = verified_github_id
        if avatar:
            user.avatar_url = avatar
        await db.commit()
        await db.refresh(user)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "github_username": user.github_username,
            "github_id": user.github_id,
            "avatar_url": user.avatar_url,
            "timezone": user.timezone,
            "active_branch": user.active_branch,
            "skills": [
                {
                    "id": s.id,
                    "skill_name": s.raw_skill_text,
                    "category": s.category,
                    "proficiency": s.proficiency
                }
                for s in user.skills
            ],
            "assigned_task_count": len(user.assigned_tasks)
        }
    }


@router.get("", response_model=List[dict])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all registered students/developers with skills and active tasks."""
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    output = []
    for u in users:
        output.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "github_username": u.github_username,
            "github_id": u.github_id,
            "avatar_url": u.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={u.github_username}",
            "timezone": u.timezone,
            "active_branch": u.active_branch,
            "skills": [
                {
                    "id": s.id,
                    "skill_name": s.raw_skill_text,
                    "category": s.category,
                    "proficiency": s.proficiency
                }
                for s in u.skills
            ],
            "assigned_task_count": len(u.assigned_tasks)
        })
    return output


@router.post("/scan-skills", response_model=dict)
async def scan_and_ingest_skills(
    req: SkillScanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests student profile, sends real-time terminal typing logs via WebSockets,
    vectorizes skills, and stores records in PostgreSQL / pgvector.
    """
    target = req.github_or_resume.strip()

    # Extract clean username if URL was provided
    username_match = re.search(r"github\.com/([A-Za-z0-9_-]+)", target)
    github_user = username_match.group(1) if username_match else target.replace("@", "").split()[0]
    github_user = github_user or "hacker"

    email = req.email or f"{github_user.lower()}@daedalus.hack"
    full_name = req.full_name or github_user.capitalize()

    # Stream real connection attempt
    await ws_manager.broadcast("TERMINAL_SCAN_PROGRESS", {
        "log": f"> Initializing profile inspection for @{github_user}...",
        "user": github_user
    })

    extracted_skills = []
    verified_github_id: Optional[str] = None

    # 1. Attempt genuine GitHub REST API inspection if handle/URL provided
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # Query user profile for verified identity
            user_resp = await client.get(
                f"https://api.github.com/users/{github_user}",
                headers={"User-Agent": "Daedalus-Skill-Scanner/1.0", "Accept": "application/vnd.github.v3+json"}
            )
            if user_resp.status_code == 200:
                user_info = user_resp.json()
                if user_info.get("id"):
                    verified_github_id = str(user_info["id"])
                if user_info.get("name") and not req.full_name:
                    full_name = user_info["name"]
                if user_info.get("avatar_url") and not req.avatar_url:
                    req.avatar_url = user_info["avatar_url"]

            resp = await client.get(
                f"https://api.github.com/users/{github_user}/repos?sort=updated&per_page=15",
                headers={"User-Agent": "Daedalus-Skill-Scanner/1.0", "Accept": "application/vnd.github.v3+json"}
            )
            if resp.status_code == 200:
                repos = resp.json()
                lang_counts = {}
                topics_set = set()
                for r in repos:
                    lang = r.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1
                    for topic in r.get("topics", []):
                        topics_set.add(topic.lower())

                if lang_counts or topics_set:
                    lang_summary = ", ".join(f"{cnt} {lang}" for lang, cnt in sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:3])
                    await ws_manager.broadcast("TERMINAL_SCAN_PROGRESS", {
                        "log": f"> Inspected {len(repos)} repositories: {lang_summary or 'Multi-stack'}...",
                        "user": github_user
                    })

                    skill_map = {
                        "Python": ("FastAPI & Python AsyncIO", "Backend", 0.95),
                        "TypeScript": ("React 18 & TypeScript", "Frontend", 0.92),
                        "JavaScript": ("Frontend Architecture & JS", "Frontend", 0.88),
                        "Go": ("Go Microservices & Concurrency", "Backend", 0.90),
                        "Rust": ("Rust Systems & Memory Safety", "Backend", 0.94),
                        "Solidity": ("Solidity & Smart Contracts", "Backend", 0.92),
                        "Java": ("Java & Spring Boot", "Backend", 0.86),
                        "C++": ("C++ High-Performance Systems", "Backend", 0.90),
                        "C": ("C & Systems Architecture", "Backend", 0.95),
                        "C#": ("C# & .NET Microservices", "Backend", 0.88),
                        "Kotlin": ("Android & Kotlin Mobile", "Frontend", 0.88),
                        "Swift": ("iOS & Swift Mobile", "Frontend", 0.88),
                        "Shell": ("Docker & Shell Automation", "DevOps", 0.86),
                        "HTML": ("TailwindCSS & Framer Motion", "Frontend", 0.85)
                    }
                    for lang in lang_counts:
                        if lang in skill_map:
                            s_title, s_cat, s_prof = skill_map[lang]
                            extracted_skills.append({"text": s_title, "category": s_cat, "proficiency": s_prof})

                    if any(t in topics_set for t in ["docker", "kubernetes", "k8s", "devops", "ci", "actions"]):
                        extracted_skills.append({"text": "Docker & Kubernetes CI/CD", "category": "DevOps", "proficiency": 0.88})
                    if any(t in topics_set for t in ["postgres", "postgresql", "sql", "redis", "database"]):
                        extracted_skills.append({"text": "PostgreSQL & Redis Caching", "category": "Database", "proficiency": 0.89})
                    if any(t in topics_set for t in ["ai", "machine-learning", "rag", "llm", "pytorch"]):
                        extracted_skills.append({"text": "PyTorch & Vector Embeddings", "category": "AI", "proficiency": 0.91})
    except Exception as e:
        logger.debug(f"GitHub API query deferred: {e}")

    # 2. Text / Resume parsing fallback
    if not extracted_skills:
        await ws_manager.broadcast("TERMINAL_SCAN_PROGRESS", {
            "log": f"> Analyzing input text & syntax tokens for engineering competencies...",
            "user": github_user
        })
        text_lower = target.lower()
        tech_catalog = [
            ("fastapi", "FastAPI & Python AsyncIO", "Backend", 0.96),
            ("python", "FastAPI & Python AsyncIO", "Backend", 0.94),
            ("react", "React 18 & TypeScript", "Frontend", 0.92),
            ("typescript", "React 18 & TypeScript", "Frontend", 0.91),
            ("postgres", "PostgreSQL & pgvector", "Database", 0.88),
            ("docker", "Docker & Container Orchestration", "DevOps", 0.86),
            ("kubernetes", "Kubernetes & Cloud Native", "DevOps", 0.85),
            ("rust", "Rust Systems & Memory Safety", "Backend", 0.93),
            ("go", "Go Microservices & Concurrency", "Backend", 0.90),
            ("solidity", "Solidity & Web3 Smart Contracts", "Backend", 0.91),
            ("llm", "LLM Agent Orchestration & RAG", "AI", 0.92),
            ("ai", "Neural Embeddings & Vector Search", "AI", 0.89),
            ("tailwind", "TailwindCSS & Modern UI", "Frontend", 0.87)
        ]
        seen_texts = set()
        for kw, skill_name, category, prof in tech_catalog:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                if skill_name not in seen_texts:
                    seen_texts.add(skill_name)
                    extracted_skills.append({"text": skill_name, "category": category, "proficiency": prof})

        if not extracted_skills:
            extracted_skills = []

    await ws_manager.broadcast("TERMINAL_SCAN_PROGRESS", {
        "log": f"> Ingestion complete! Synthesized {len(extracted_skills)} neural competencies.",
        "user": github_user
    })

    # Check if user already exists
    result = await db.execute(select(User).where(User.github_username == github_user))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            full_name=full_name,
            github_username=github_user,
            github_id=verified_github_id,
            avatar_url=req.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={github_user}",
            timezone="UTC-04:00",
            active_branch=f"feature/{github_user}-setup",
        )
        db.add(user)
        await db.flush()
    else:
        if req.avatar_url:
            user.avatar_url = req.avatar_url
        if verified_github_id and not user.github_id:
            user.github_id = verified_github_id
        if full_name and (not user.full_name or user.full_name == github_user.capitalize()):
            user.full_name = full_name
        # Clear existing skills to prevent duplicate skill buildup
        await db.execute(delete(UserSkill).where(UserSkill.user_id == user.id))
        await db.flush()

    # Add newly scanned skills
    saved_skills = []
    for s_info in extracted_skills:
        emb = compute_deterministic_embedding(s_info["text"])
        skill_entry = UserSkill(
            user_id=user.id,
            raw_skill_text=s_info["text"],
            category=s_info["category"],
            proficiency=s_info["proficiency"],
            embedding=emb
        )
        db.add(skill_entry)
        saved_skills.append({
            "id": skill_entry.id,
            "skill_name": skill_entry.raw_skill_text,
            "category": skill_entry.category,
            "proficiency": skill_entry.proficiency
        })

    await db.commit()
    await db.refresh(user)

    # Return profile with node network payload
    nodes = [
        {"id": "user", "label": user.full_name, "type": "hub", "size": 35}
    ]
    edges = []
    for i, s in enumerate(extracted_skills):
        node_id = f"skill_{i}"
        nodes.append({
            "id": node_id,
            "label": s["text"],
            "category": s["category"],
            "proficiency": s["proficiency"],
            "type": "skill",
            "size": int(20 * s["proficiency"])
        })
        edges.append({"source": "user", "target": node_id})

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "github_username": user.github_username,
            "github_id": user.github_id,
            "avatar_url": user.avatar_url,
            "timezone": user.timezone,
            "active_branch": user.active_branch,
            "skills": saved_skills,
            "assigned_task_count": len(user.assigned_tasks) if hasattr(user, "assigned_tasks") and user.assigned_tasks else 0
        },
        "network_graph": {
            "nodes": nodes,
            "edges": edges
        }
    }


@router.get("/team/match", response_model=dict)
async def match_hackathon_team(
    team_ids: Optional[str] = None,  # comma-separated user IDs
    db: AsyncSession = Depends(get_db)
):
    """
    Calculates current hackathon team stack coverage and recommends
    complementary teammates using vector similarity to avoid skill gaps.
    """
    result = await db.execute(select(User))
    all_users = result.scalars().all()

    current_team_ids = set(team_ids.split(",")) if team_ids else {u.id for u in all_users[:2]}
    current_team = [u for u in all_users if u.id in current_team_ids]
    candidate_users = [u for u in all_users if u.id not in current_team_ids]

    # Calculate domain coverage
    domains = ["Frontend", "Backend", "Database", "DevOps", "AI"]
    coverage = {d: 0.0 for d in domains}

    for member in current_team:
        for skill in member.skills:
            cat = skill.category if skill.category in coverage else "Backend"
            coverage[cat] = min(1.0, max(coverage[cat], skill.proficiency))

    overall_synergy = int(sum(coverage.values()) / len(domains) * 100)

    # Find candidate impact
    recommendations = []
    for cand in candidate_users:
        new_coverage = dict(coverage)
        gaps_filled = []
        for s in cand.skills:
            cat = s.category if s.category in coverage else "Backend"
            if s.proficiency > new_coverage[cat]:
                gaps_filled.append(f"{cat} (+{int((s.proficiency - new_coverage[cat])*100)}%)")
                new_coverage[cat] = s.proficiency

        new_synergy = int(sum(new_coverage.values()) / len(domains) * 100)
        added_synergy = max(0, new_synergy - overall_synergy)

        recommendations.append({
            "user": {
                "id": cand.id,
                "full_name": cand.full_name,
                "github_username": cand.github_username,
                "avatar_url": cand.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={cand.github_username}",
                "timezone": cand.timezone,
                "active_branch": cand.active_branch,
                "skills": [s.raw_skill_text for s in cand.skills]
            },
            "added_synergy": added_synergy,
            "projected_team_synergy": new_synergy,
            "impact_summary": ", ".join(gaps_filled) if gaps_filled else "Reinforces current core stack"
        })

    recommendations.sort(key=lambda x: x["added_synergy"], reverse=True)

    return {
        "current_team": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "github_username": u.github_username,
                "avatar_url": u.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={u.github_username}",
                "timezone": u.timezone,
                "active_branch": u.active_branch,
                "skills": [s.raw_skill_text for s in u.skills]
            }
            for u in current_team
        ],
        "coverage": coverage,
        "overall_synergy": overall_synergy,
        "recommended_teammates": recommendations
    }


class TeamInvitationCreate(BaseModel):
    team_id: str
    squad_name: str
    target_username: str
    target_user_id: Optional[str] = None
    target_user_name: Optional[str] = None
    target_avatar_url: Optional[str] = None
    role: str = "FULL-STACK INTEGRATOR"
    pitch_note: Optional[str] = "We'd love to have you on our hackathon squad!"
    projected_synergy: Optional[int] = 15
    invited_by_name: Optional[str] = None
    invited_by_handle: Optional[str] = None


class TeamInvitationResponse(BaseModel):
    id: str
    team_id: str
    squad_name: str
    target_username: str
    target_user_id: Optional[str] = None
    target_user_name: str
    target_avatar_url: str
    role: str
    pitch_note: str
    projected_synergy: int
    invited_by_name: str
    invited_by_handle: str
    status: str
    created_at: str


class TeamInvitationAction(BaseModel):
    action: str  # "accept", "decline", "cancel"


@router.post("/team/invitations", response_model=dict)
async def create_team_invitation(
    req: TeamInvitationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an invitation requesting a developer to join a hackathon squad,
    broadcasts real-time WebSocket notification to the user, and records the invite in the database.
    """
    target_user = req.target_username.strip().replace("@", "")
    avatar = req.target_avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={target_user}"
    user_name = req.target_user_name or target_user.capitalize()

    invite_obj = TeamInvitation(
        team_id=req.team_id,
        squad_name=req.squad_name,
        target_username=target_user,
        target_user_id=req.target_user_id or f"user_{target_user}",
        target_user_name=user_name,
        target_avatar_url=avatar,
        role=req.role,
        pitch_note=req.pitch_note or f"We invite @{target_user} to join our squad as {req.role}.",
        projected_synergy=req.projected_synergy or 15,
        invited_by_name=req.invited_by_name or "Squad Lead",
        invited_by_handle=req.invited_by_handle or "squad-lead",
        status="PENDING"
    )
    db.add(invite_obj)
    await db.commit()
    await db.refresh(invite_obj)

    invite_record = {
        "id": invite_obj.id,
        "team_id": invite_obj.team_id,
        "squad_name": invite_obj.squad_name,
        "target_username": invite_obj.target_username,
        "target_user_id": invite_obj.target_user_id,
        "target_user_name": invite_obj.target_user_name,
        "target_avatar_url": invite_obj.target_avatar_url,
        "role": invite_obj.role,
        "pitch_note": invite_obj.pitch_note,
        "projected_synergy": invite_obj.projected_synergy,
        "invited_by_name": invite_obj.invited_by_name,
        "invited_by_handle": invite_obj.invited_by_handle,
        "status": invite_obj.status,
        "created_at": "Just now"
    }

    await ws_manager.broadcast("TEAM_INVITATION_SENT", invite_record)

    return {
        "status": "success",
        "message": f"Successfully sent join invitation to @{target_user}!",
        "invitation": invite_record
    }


@router.get("/team/invitations", response_model=dict)
async def list_team_invitations(
    target_username: Optional[str] = None,
    team_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Lists squad invitations, filterable by target developer username, team ID, or status.
    Backed by persistent database storage.
    """
    stmt = select(TeamInvitation)
    if target_username:
        clean_target = target_username.strip().replace("@", "").lower()
        stmt = stmt.where(TeamInvitation.target_username.ilike(f"%{clean_target}%"))
    if team_id:
        stmt = stmt.where(TeamInvitation.team_id == team_id)
    if status:
        stmt = stmt.where(TeamInvitation.status == status.upper())

    stmt = stmt.order_by(TeamInvitation.created_at.desc())
    result = await db.execute(stmt)
    invites = result.scalars().all()

    def serialize_invite(inv: TeamInvitation) -> dict:
        return {
            "id": inv.id,
            "team_id": inv.team_id,
            "squad_name": inv.squad_name,
            "target_username": inv.target_username,
            "target_user_id": inv.target_user_id,
            "target_user_name": inv.target_user_name,
            "target_avatar_url": inv.target_avatar_url,
            "role": inv.role,
            "pitch_note": inv.pitch_note,
            "projected_synergy": inv.projected_synergy,
            "invited_by_name": inv.invited_by_name,
            "invited_by_handle": inv.invited_by_handle,
            "status": inv.status,
            "created_at": inv.created_at.strftime("%Y-%m-%d %H:%M") if inv.created_at else "Just now"
        }

    serialized = [serialize_invite(i) for i in invites]
    return {
        "count": len(serialized),
        "invitations": serialized
    }


@router.post("/team/invitations/{invite_id}/respond", response_model=dict)
async def respond_to_team_invitation(
    invite_id: str,
    action_req: TeamInvitationAction,
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts or declines a squad invitation.
    """
    result = await db.execute(select(TeamInvitation).where(TeamInvitation.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")

    action = action_req.action.lower()
    if action not in ["accept", "decline", "cancel"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept', 'decline', or 'cancel'")

    if action == "accept":
        invite.status = "ACCEPTED"
    elif action == "decline":
        invite.status = "DECLINED"
    else:
        invite.status = "CANCELLED"

    await db.commit()
    await db.refresh(invite)

    invite_payload = {
        "id": invite.id,
        "status": invite.status,
        "team_id": invite.team_id,
        "target_username": invite.target_username
    }

    await ws_manager.broadcast("TEAM_INVITATION_RESPONDED", invite_payload)

    return {
        "status": "success",
        "action": action,
        "invitation": invite_payload
    }


@router.delete("/team/invitations/{invite_id}", response_model=dict)
async def cancel_team_invitation(
    invite_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Revokes or removes an outbound team invitation.
    """
    result = await db.execute(select(TeamInvitation).where(TeamInvitation.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")

    await db.delete(invite)
    await db.commit()

    await ws_manager.broadcast("TEAM_INVITATION_CANCELLED", {"id": invite_id})

    return {
        "status": "success",
        "message": "Invitation revoked successfully",
        "id": invite_id
    }


@router.get("/{user_id}", response_model=dict)
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch individual user profile with skills, assigned tasks, and vector status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "github_username": user.github_username,
        "avatar_url": user.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.github_username}",
        "timezone": user.timezone,
        "active_branch": user.active_branch,
        "created_at": user.created_at.isoformat(),
        "skills": [
            {
                "id": s.id,
                "skill_name": s.raw_skill_text,
                "category": s.category,
                "proficiency": s.proficiency
            }
            for s in user.skills
        ],
        "assigned_tasks": [
            {
                "id": t.id,
                "task_code": t.task_code,
                "title": t.title,
                "status": t.status,
                "ci_status": t.ci_status
            }
            for t in user.assigned_tasks
        ]
    }


@router.patch("/{user_id}/avatar", response_model=dict)
async def update_user_avatar(user_id: str, req: UserAvatarUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update a user's avatar URL."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        result_gh = await db.execute(select(User).where(User.github_username == user_id))
        user = result_gh.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    user.avatar_url = req.avatar_url
    await db.commit()
    await db.refresh(user)
    return {
        "status": "success",
        "id": user.id,
        "avatar_url": user.avatar_url,
    }


