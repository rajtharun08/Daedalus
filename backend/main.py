import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.db.session import init_db
import app.db.session as db_session
from app.db.models import User, UserSkill
from app.services.embeddings import compute_deterministic_embedding
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("daedalus.main")


async def seed_initial_students():
    """Seeds sample student hacker profiles if database is empty."""
    async with db_session.AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        existing = result.scalars().first()
        if existing:
            return

        logger.info("Seeding initial student developer profiles...")
        mock_students = [
            {
                "email": "alex@daedalus.hack",
                "full_name": "Alex Chen",
                "github_username": "alexc-dev",
                "github_id": "12345678",
                "timezone": "UTC-04:00 (EDT)",
                "active_branch": "feat/CORE-01-db",
                "skills": [
                    ("FastAPI & Python AsyncIO", "Backend", 0.95),
                    ("PostgreSQL & pgvector", "Database", 0.92),
                    ("SQLAlchemy & Migrations", "Database", 0.88),
                    ("Docker & Docker Compose", "DevOps", 0.80),
                ]
            },
            {
                "email": "sarah@daedalus.hack",
                "full_name": "Sarah Connor",
                "github_username": "sarah-c",
                "github_id": "23456789",
                "timezone": "UTC-07:00 (PDT)",
                "active_branch": "feat/UI-01-shell",
                "skills": [
                    ("React 18 & TypeScript", "Frontend", 0.96),
                    ("Tailwind CSS & Glassmorphism", "Frontend", 0.94),
                    ("Framer Motion Micro-Interactions", "Frontend", 0.90),
                    ("WebSockets Client & State", "Frontend", 0.85),
                ]
            },
            {
                "email": "marcus@daedalus.hack",
                "full_name": "Marcus Aurelius",
                "github_username": "marcus-ai",
                "github_id": "34567890",
                "timezone": "UTC+01:00 (BST)",
                "active_branch": "feat/AI-01-pipeline",
                "skills": [
                    ("LLM Orchestration & Prompting", "AI", 0.94),
                    ("Vector Embeddings & RAG", "AI", 0.91),
                    ("Python & REST APIs", "Backend", 0.86),
                    ("pgvector Similarity Search", "Database", 0.89),
                ]
            },
            {
                "email": "elena@daedalus.hack",
                "full_name": "Elena Rostova",
                "github_username": "elena-ops",
                "github_id": "45678901",
                "timezone": "UTC+02:00 (CEST)",
                "active_branch": "feat/OPS-02-actions",
                "skills": [
                    ("GitHub Actions & CI/CD", "DevOps", 0.96),
                    ("Docker Multi-stage Builds", "DevOps", 0.93),
                    ("Linux & Bash Scripting", "DevOps", 0.89),
                    ("Pytest & Code Quality", "DevOps", 0.85),
                ]
            }
        ]

        for s in mock_students:
            user = User(
                email=s["email"],
                full_name=s["full_name"],
                github_username=s["github_username"],
                github_id=s.get("github_id"),
                timezone=s["timezone"],
                active_branch=s["active_branch"],
                avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={s['github_username']}"
            )
            session.add(user)
            await session.flush()

            for skill_text, category, prof in s["skills"]:
                emb = compute_deterministic_embedding(skill_text)
                sk = UserSkill(
                    user_id=user.id,
                    raw_skill_text=skill_text,
                    category=category,
                    proficiency=prof,
                    embedding=emb
                )
                session.add(sk)

        await session.commit()
        logger.info("Successfully seeded 4 student developer profiles.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Daedalus AI Engine...")
    await init_db()
    await seed_initial_students()
    yield
    logger.info("Shutting down Daedalus AI Engine...")


from app.core.security_middleware import SensitiveHeaderRedactorMiddleware, SensitiveHeaderFilter

# Apply log redaction filter to root logger
for handler in logging.root.handlers:
    handler.addFilter(SensitiveHeaderFilter())

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Autonomous Multi-Agent Orchestration Platform for Hackathon Teams",
    lifespan=lifespan
)

# Sensitive BYOK header redactor middleware (protects keys in transit)
app.add_middleware(SensitiveHeaderRedactorMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix="/api/v1")

# Mount WebSocket at root /ws as well as /api/v1/ws for client flexibility
from app.api.v1.endpoints import ws as ws_endpoint
app.include_router(ws_endpoint.router, tags=["WebSockets"])


@app.get("/")
def read_root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "engine": "FastAPI"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
