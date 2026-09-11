import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services.ai_provider import test_provider_key, DEFAULT_MODELS

logger = logging.getLogger("daedalus.byok")
router = APIRouter()


class BYOKValidateRequest(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


class BYOKValidateResponse(BaseModel):
    valid: bool
    provider: str
    model: Optional[str] = None
    message: str
    latency_ms: Optional[int] = None
    available_models: List[str] = []


@router.post("/validate", response_model=BYOKValidateResponse)
async def validate_byok_key(req: BYOKValidateRequest):
    """
    Live non-destructive verification probe for Google Gemini, OpenAI,
    Anthropic Claude, and GitHub Personal Access Tokens.
    Tests API authentication, network latency, and model availability.
    """
    provider = req.provider.lower().strip()
    if provider not in ["gemini", "openai", "anthropic", "github"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider '{provider}'. Must be gemini, openai, anthropic, or github."
        )

    clean_key = req.api_key.strip()
    if not clean_key:
        raise HTTPException(status_code=400, detail="API key is required.")

    target_model = req.model or DEFAULT_MODELS.get(provider)
    is_valid, message, latency_ms, available_models = await test_provider_key(
        provider=provider,
        api_key=clean_key,
        model=target_model
    )

    return BYOKValidateResponse(
        valid=is_valid,
        provider=provider,
        model=target_model,
        message=message,
        latency_ms=latency_ms,
        available_models=available_models
    )


@router.get("/providers")
async def get_byok_providers():
    """Returns supported BYOK providers and their security specs."""
    return {
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini",
                "default_model": "gemini-3.6-flash",
                "supported_models": ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
                "key_pattern": "AIzaSy...",
                "key_url": "https://aistudio.google.com/app/apikey",
                "description": "High-velocity multimodal decomposition with structured JSON mode."
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "default_model": "gpt-4o-mini",
                "supported_models": ["gpt-4o", "gpt-4o-mini", "o3-mini"],
                "key_pattern": "sk-proj-...",
                "key_url": "https://platform.openai.com/api-keys",
                "description": "Deterministic reasoning and contract-first API route synthesis."
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "default_model": "claude-3-5-sonnet-20241022",
                "supported_models": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
                "key_pattern": "sk-ant-...",
                "key_url": "https://console.anthropic.com/settings/keys",
                "description": "Complex architectural system breakdown and dependency modeling."
            },
            {
                "id": "github",
                "name": "GitHub Personal Access Token",
                "default_model": "REST API v3",
                "supported_models": ["repo", "workflow", "read:user"],
                "key_pattern": "ghp_...",
                "key_url": "https://github.com/settings/tokens",
                "description": "Automatic remote repository generation and branch deployment."
            }
        ],
        "security_policy": {
            "encryption": "AES-256-GCM via Web Crypto API (Client-side PBKDF2)",
            "transit": "Ephemeral TLS headers (X-BYOK-Key, X-BYOK-Provider)",
            "storage": "Zero server-side persistence; in-memory lifetime only",
            "redaction": "SensitiveHeaderRedactorMiddleware active on all server stdout"
        }
    }
