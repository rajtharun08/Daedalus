import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import ws_manager

logger = logging.getLogger("daedalus.api.ws")
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket tunnel for terminal logs, task animations, and CI notifications.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat / client messages
            data = await websocket.receive_text()
            # Echo or acknowledge
            await websocket.send_text('{"status": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.info(f"WebSocket closed: {e}")
        ws_manager.disconnect(websocket)
