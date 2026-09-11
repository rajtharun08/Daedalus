import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import Project, Task
from app.services.scaffolding_engine import generate_scaffold_zip, generate_scaffold_files

router = APIRouter()


@router.get("/{project_id}/preview", response_model=dict)
async def preview_scaffold(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Returns preview of all files and mock routes that will be generated."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks_result = await db.execute(
        select(Task).join(Task.epic).where(Task.epic.has(project_id=project_id))
    )
    tasks = tasks_result.scalars().all()

    mock_routes = []
    task_dicts = []
    for t in tasks:
        task_dicts.append({
            "task_code": t.task_code,
            "title": t.title,
            "api_route_spec": t.api_route_spec
        })
        if t.api_route_spec:
            try:
                spec = json.loads(t.api_route_spec)
                mock_routes.append({
                    "task_code": t.task_code,
                    "path": spec.get("path"),
                    "method": spec.get("method"),
                    "summary": spec.get("summary")
                })
            except Exception:
                pass

    generated_files = generate_scaffold_files(project.title, task_dicts)

    def get_file_meta(path: str) -> tuple:
        if path == "docker-compose.yml":
            return "config", "PostgreSQL + pgvector, Backend, Frontend"
        elif path == ".github/workflows/ci.yml":
            return "ci", "Pytest, Linting & Webhook notification"
        elif path == "backend/app/main.py":
            return "backend", "FastAPI App factory & CORS"
        elif path == "backend/app/routers/mock_routes.py":
            return "backend", f"{len(mock_routes)} Synthesized Mock Endpoints"
        elif path == "backend/requirements.txt":
            return "backend", "Pinned dependencies"
        elif path == "backend/Dockerfile":
            return "docker", "Python 3.12 slim image"
        elif path == "backend/tests/test_main.py":
            return "tests", "Pytest integration tests"
        elif path == "frontend/package.json":
            return "frontend", "React 18 + Vite + Tailwind"
        elif path == "frontend/vite.config.ts":
            return "frontend", "Vite build & reverse proxy configuration"
        elif path == "frontend/index.html":
            return "frontend", "HTML5 entry point"
        elif path == "frontend/tsconfig.json":
            return "frontend", "TypeScript compiler options"
        elif path == "frontend/tailwind.config.js":
            return "frontend", "Tailwind CSS design tokens"
        elif path == "frontend/postcss.config.js":
            return "frontend", "PostCSS build pipeline"
        elif path == "frontend/src/App.tsx":
            return "frontend", "API-connected client shell"
        elif path == "frontend/src/main.tsx":
            return "frontend", "React DOM mount point"
        elif path == "frontend/src/index.css":
            return "frontend", "Tailwind base styles"
        elif path == "frontend/Dockerfile":
            return "docker", "Multi-stage Nginx container"
        elif path == "README.md":
            return "docs", "Project onboarding & task code instructions"
        return "file", "Scaffold source file"

    file_tree = []
    for path, content in generated_files.items():
        if not content.strip():
            continue
        ftype, fdesc = get_file_meta(path)
        file_tree.append({
            "path": path,
            "type": ftype,
            "description": fdesc,
            "content": content
        })

    return {
        "project_id": project.id,
        "project_name": project.title,
        "file_count": len(file_tree),
        "files": file_tree,
        "mock_routes": mock_routes
    }


@router.get("/{project_id}/download")
async def download_scaffold_zip(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically generates the complete starter repository in-memory
    and streams it directly as a downloadable .zip archive.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks_result = await db.execute(
        select(Task).join(Task.epic).where(Task.epic.has(project_id=project_id))
    )
    tasks = tasks_result.scalars().all()

    task_dicts = [
        {
            "task_code": t.task_code,
            "title": t.title,
            "api_route_spec": t.api_route_spec
        }
        for t in tasks
    ]

    zip_stream = generate_scaffold_zip(project.title, task_dicts)
    clean_filename = project.title.lower().replace(" ", "_") + "_scaffold.zip"

    return StreamingResponse(
        zip_stream,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={clean_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
