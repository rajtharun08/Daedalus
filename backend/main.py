import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("daedalus.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Daedalus AI Engine...")
    await init_db()
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
