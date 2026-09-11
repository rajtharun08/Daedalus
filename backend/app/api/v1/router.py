from fastapi import APIRouter
from app.api.v1.endpoints import users, decomposition, scaffolding, webhooks, ws, byok

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["Users & Skills"])
api_router.include_router(decomposition.router, prefix="/projects", tags=["Decomposition & Roadmap"])
api_router.include_router(scaffolding.router, prefix="/projects/scaffold", tags=["Scaffolding Engine"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Git & CI Webhooks"])
api_router.include_router(byok.router, prefix="/byok", tags=["Bring Your Own Key (BYOK)"])
api_router.include_router(ws.router, tags=["WebSockets"])
