import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Daedalus AI"
    VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://daedalus:daedalus_password@localhost:5432/daedalus_db"
    SQLITE_FALLBACK_URL: str = "sqlite+aiosqlite:///./daedalus_dev.db"

    # Embedding configuration
    EMBEDDING_DIM: int = 384

    # Security & Webhooks
    GITHUB_WEBHOOK_SECRET: str = "daedalus_secret_key_123"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Optional External AI keys
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
