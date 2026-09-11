import json
import logging
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import verify_github_signature
from app.db.session import get_db
from app.db.models import WebhookDelivery
from app.services.git_tracker import process_git_event

logger = logging.getLogger("daedalus.webhooks")
router = APIRouter()


class WebhookSimulationRequest(BaseModel):
    event_type: str = Field(..., description="push, pull_request, check_run")
    task_code: str = Field(..., description="Target task code (e.g., CORE-01)")
    commit_message: Optional[str] = "feat: closes #CORE-01 setup database and models"
    branch_name: Optional[str] = "task/CORE-01"
    ci_conclusion: Optional[str] = "success"  # "success" or "failure"


@router.post("/github")
async def handle_github_webhook(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
    x_github_delivery: str = Header(None, alias="X-GitHub-Delivery"),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives and processes GitHub Webhooks with HMAC-SHA256 signature verification.
    Supported events: push, pull_request, check_run, workflow_run.
    """
    body_bytes = await request.body()

    # Verify signature if secret is configured
    if settings.GITHUB_WEBHOOK_SECRET:
        if x_hub_signature_256 or settings.ENV != "development":
            if not verify_github_signature(body_bytes, x_hub_signature_256, settings.GITHUB_WEBHOOK_SECRET):
                logger.warning("Invalid GitHub webhook HMAC-SHA256 signature rejected.")
                raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    delivery_id = x_github_delivery or str(uuid4())

    # Log delivery for audit trail
    delivery_record = WebhookDelivery(
        event_type=x_github_event,
        delivery_guid=delivery_id,
        payload=json.dumps(payload),
        processed=False
    )
    db.add(delivery_record)
    await db.flush()

    # Process state machine updates
    result = await process_git_event(x_github_event, payload, db)
    delivery_record.processed = True
    await db.commit()

    return {
        "status": "received",
        "event": x_github_event,
        "delivery_id": delivery_id,
        "result": result
    }


@router.post("/simulate")
async def simulate_webhook_event(
    req: WebhookSimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates a live GitHub Webhook event for interactive testing from the UI.
    Allows testing 'push', 'pull_request', and CI 'check_run' without external webhooks.
    """
    payload = {}
    event_type = req.event_type.lower()

    if event_type == "push":
        payload = {
            "ref": f"refs/heads/{req.branch_name}",
            "commits": [
                {
                    "id": "a1b2c3d4e5f67890",
                    "message": req.commit_message or f"feat: updates on {req.task_code}",
                    "author": {"name": "Alex Chen", "username": "alexc"}
                }
            ]
        }
    elif event_type == "pull_request":
        payload = {
            "action": "opened",
            "pull_request": {
                "number": 42,
                "title": f"feat({req.task_code}): complete implementation",
                "body": f"Resolves #{req.task_code}. Tests passing locally.",
                "head": {"ref": req.branch_name}
            }
        }
    elif event_type in ["check_run", "ci"]:
        event_type = "check_run"
        payload = {
            "check_run": {
                "status": "completed",
                "conclusion": req.ci_conclusion or "success",
                "name": "CI / CD Verification Pipeline",
                "head_branch": req.branch_name
            }
        }

    # Execute git tracker
    result = await process_git_event(event_type, payload, db)
    return {
        "status": "simulated",
        "event_type": event_type,
        "result": result
    }
