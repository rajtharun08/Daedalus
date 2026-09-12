import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text

from app.core.config import settings
from app.db.models import Base

logger = logging.getLogger("daedalus.db")

# Global engine and sessionmaker
engine = None
AsyncSessionLocal = None
is_postgres = False


async def init_engine():
    global engine, AsyncSessionLocal, is_postgres

    # Try PostgreSQL first
    try:
        pg_engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
        )
        async with pg_engine.connect() as conn:
            # Enable pgvector if postgres
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.commit()

        engine = pg_engine
        is_postgres = True
        logger.info("Connected to PostgreSQL with pgvector successfully.")
    except Exception as e:
        logger.warning(
            f"PostgreSQL unreachable ({e}). Activating Resilient Dev Mode (SQLite Fallback)."
        )
        engine = create_async_engine(
            settings.SQLITE_FALLBACK_URL,
            echo=False,
        )
        is_postgres = False

    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        await init_engine()
        await init_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    if engine is None:
        await init_engine()
    
    # 1. Create all tables in their own isolated transaction
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Run idempotent migrations in separate transactions
    for col_stmt in [
        "ALTER TABLE projects ADD COLUMN squad_id VARCHAR(100)",
        "ALTER TABLE projects ADD COLUMN squad_name VARCHAR(200)",
        "ALTER TABLE projects ADD COLUMN squad_member_ids TEXT",
        "ALTER TABLE users ADD COLUMN github_id VARCHAR(50)",
    ]:
        try:
            async with engine.begin() as conn:
                if is_postgres:
                    pg_stmt = col_stmt.replace("ADD COLUMN", "ADD COLUMN IF NOT EXISTS")
                    await conn.execute(text(pg_stmt))
                else:
                    await conn.execute(text(col_stmt))
        except Exception:
            pass

    logger.info("Database schema synchronized.")
