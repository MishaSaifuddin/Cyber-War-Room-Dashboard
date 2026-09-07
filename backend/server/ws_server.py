"""
Cyber War Room - WebSocket Streaming Server
Streams real telemetry data to connected dashboard clients
"""
import asyncio
import json

import websockets

from backend.detection.engine import engine
from backend.config import WS_HOST, WS_PORT


class WebSocketServer:
    """WebSocket server that streams telemetry data."""

    def __init__(self):
        self.host = WS_HOST
        self.port = WS_PORT
        self.clients = set()
        self.serving = False

    async def _stream_telemetry(self, websocket, path=None):
        """Handle a single client connection and stream data."""
        self.clients.add(websocket)
        client_ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
        print(f"[WS] Client connected: {client_ip}")

        try:
            # Wait for the engine to have real data before streaming
            await asyncio.to_thread(engine.wait_for_data, 15)

            # Send initial snapshot immediately
            snapshot = engine.get_snapshot()
            await websocket.send(json.dumps({
                "type": "snapshot",
                "data": snapshot,
            }))

            while True:
                # Send updates every 2 seconds
                await asyncio.sleep(2)
                snapshot = engine.get_snapshot()
                await websocket.send(json.dumps({
                    "type": "update",
                    "data": snapshot,
                }))

        except websockets.exceptions.ConnectionClosed:
            print(f"[WS] Client disconnected: {client_ip}")
        except Exception as e:
            print(f"[WS] Error with client {client_ip}: {e}")
        finally:
            self.clients.discard(websocket)

    async def start_async(self):
        """Start the WebSocket server (async)."""
        self.serving = True
        print(f"[WS] WebSocket server starting on ws://{self.host}:{self.port}")
        async with websockets.serve(
            self._stream_telemetry,
            self.host,
            self.port,
            ping_interval=20,
            ping_timeout=60,
        ):
            print(f"[WS] WebSocket server running at ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever

    def start(self):
        """Start the WebSocket server in the current thread."""
        asyncio.run(self.start_async())


server = WebSocketServer()
