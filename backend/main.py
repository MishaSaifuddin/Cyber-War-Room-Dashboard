"""
Cyber War Room - Backend Entry Point
Starts the detection engine, WebSocket server, and HTTP dashboard server
"""
import os
import sys
import threading

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import HTTP_HOST, HTTP_PORT, STATIC_DIR, WS_PORT
from backend.detection.engine import engine
from backend.server.http_server import HTTPServer
from backend.server.ws_server import WebSocketServer


def print_banner():
    print("=" * 60)
    print("  ==========================================")
    print("  ||  CYBER WAR ROOM - DETECTION SYSTEM  ||")
    print("  ||     Real-time Threat Monitoring      ||")
    print("  ==========================================")
    print("=" * 60)
    print("")
    print(">> Platform:", os.name)
    print(">> Starting detection engine...")
    print(">> Starting servers...")
    print("")


def main():
    print_banner()

    # 1. Start detection engine
    print("[Engine] Starting detection engine...")
    engine.start()
    print("[Engine] Detection engine running")

    # 2. Start HTTP server (serves dashboard)
    http_server = HTTPServer(HTTP_HOST, HTTP_PORT, STATIC_DIR)
    http_server.start()

    # 3. Start WebSocket server (streams telemetry)
    print(f"[Main] Open dashboard: http://{HTTP_HOST}:{HTTP_PORT}/index.html")
    print(f"[Main] WebSocket endpoint: ws://{HTTP_HOST}:{WS_PORT}")
    print("[Main] Press Ctrl+C to stop")
    print("")

    try:
        ws_server = WebSocketServer()
        ws_server.start()
    except KeyboardInterrupt:
        print("\n[Main] Shutting down...")
        http_server.stop()
        engine.stop()
        print("[Main] System stopped. Goodbye!")
        sys.exit(0)


if __name__ == "__main__":
    main()
