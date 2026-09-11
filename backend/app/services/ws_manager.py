import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("daedalus.ws")


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: dict):
        """
        Broadcast an event to all connected UI clients.
        Example event_types:
          - "TERMINAL_SCAN_PROGRESS"
          - "DECOMPOSITION_PROGRESS"
          - "TASK_UPDATED"
          - "WEBHOOK_PROCESSED"
          - "CI_PASSED"
        """
        message = json.dumps({"event": event_type, "data": data})
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


ws_manager = WebSocketManager()
