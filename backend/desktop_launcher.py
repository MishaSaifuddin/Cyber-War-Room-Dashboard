"""
Cyber War Room - Desktop Launcher
Provides a tray icon, auto-opens the dashboard in the browser, and runs the
backend servers. This is the entry point used by the packaged .exe.
"""
import logging
import os
import sys
import threading
import time
import webbrowser

# Add backend to path (safe whether from source or PyInstaller bundle)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import (
    APP_ROOT,
    HTTP_HOST,
    HTTP_PORT,
    STATIC_DIR,
    WS_HOST,
    WS_PORT,
)
from backend.detection.engine import engine
from backend.server.http_server import HTTPServer
from backend.server.ws_server import WebSocketServer

DASHBOARD_URL = f"http://{HTTP_HOST}:{HTTP_PORT}/index.html"
ICON_PATH = os.path.join(APP_ROOT, "assets", "war_room.png")
MUTEX_NAME = "CyberWarRoomSingleInstance"


def acquire_single_instance():
    """Return a mutex handle if this is the first instance, else None."""
    try:
        import ctypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        handle = kernel32.CreateMutexW(None, False, MUTEX_NAME)
        if ctypes.get_last_error() == 183 or not handle:
            if handle:
                kernel32.CloseHandle(handle)
            return None
        return handle
    except Exception:
        return True


def release_single_instance(handle):
    try:
        import ctypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        if handle:
            kernel32.ReleaseMutex(handle)
            kernel32.CloseHandle(handle)
    except Exception:
        pass


def setup_logging():
    """Log to a file next to the app (windowed mode has no console)."""
    log_dir = os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else APP_ROOT
    log_file = os.path.join(log_dir, "war_room.log")
    try:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[logging.FileHandler(log_file, encoding="utf-8")],
        )
    except Exception as exc:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        logging.getLogger("launcher").warning("Could not create log file: %s", exc)


class TrayIcon:
    """System tray icon with Open Dashboard / Quit controls."""

    def __init__(self):
        self._icon = None
        self._stop_event = threading.Event()
        self._http_server = None

    def _load_image(self):
        try:
            from PIL import Image
        except Exception as exc:
            logging.getLogger("launcher").warning("PIL unavailable for tray icon: %s", exc)
            return None
        if ICON_PATH and os.path.exists(ICON_PATH):
            try:
                return Image.open(ICON_PATH)
            except Exception as exc:
                logging.getLogger("launcher").warning("Could not load tray icon: %s", exc)
        return None

    def _open_dashboard(self, icon=None, item=None):
        docking = webbrowser.open(DASHBOARD_URL)
        logging.getLogger("launcher").info("Opening dashboard: %s (started=%s)", DASHBOARD_URL, docking)

    def _quit(self, icon=None, item=None):
        logging.getLogger("launcher").info("Quit requested via tray")
        self._stop_event.set()
        if icon is not None:
            try:
                icon.stop()
            except Exception:
                pass

    def set_http_server(self, http_server):
        self._http_server = http_server

    def start(self):
        """Start the tray icon on a background daemon thread."""
        try:
            import pystray
        except Exception as exc:
            logging.getLogger("launcher").warning("pystray unavailable, running headless: %s", exc)
            return

        image = self._load_image()
        menu = pystray.Menu(
            pystray.MenuItem("Open Dashboard", self._open_dashboard, default=True),
            pystray.MenuItem("Quit", self._quit),
        )
        self._icon = pystray.Icon("Cyber War Room", image, "Cyber War Room", menu)

        def _run():
            try:
                self._icon.run()
            except Exception as exc:
                logging.getLogger("launcher").error("Tray icon error: %s", exc)

        threading.Thread(target=_run, daemon=True).start()

    def stop(self):
        if self._icon is not None:
            try:
                self._icon.stop()
            except Exception:
                pass

    def wait(self):
        self._stop_event.wait()


def run_ws_server():
    """Run the WebSocket server loop in a background thread."""
    try:
        ws_server = WebSocketServer()
        ws_server.start()
    except Exception as exc:
        logging.getLogger("launcher").error("WebSocket server error: %s", exc)


def main():
    setup_logging()
    log = logging.getLogger("launcher")
    log.info("Starting Cyber War Room desktop app (root=%s)", APP_ROOT)

    mutex = acquire_single_instance()
    if mutex is None:
        log.info("Another instance is already running. Opening dashboard instead.")
        webbrowser.open(DASHBOARD_URL)
        return

    http_server = None
    tray = None
    try:
        # 1. Start detection engine
        log.info("Starting detection engine...")
        engine.start()
        ready = engine.wait_for_data(20)
        log.info("Engine started (data ready=%s)", ready)

        # 2. Start HTTP server (serves dashboard)
        http_server = HTTPServer(HTTP_HOST, HTTP_PORT, STATIC_DIR)
        http_server.start()
        log.info("HTTP server on %s:%s serving %s", HTTP_HOST, HTTP_PORT, STATIC_DIR)

        # 3. Start WebSocket streamer in background thread
        threading.Thread(target=run_ws_server, daemon=True).start()
        time.sleep(1)

        # 4. Show tray icon, then open the dashboard
        tray = TrayIcon()
        tray.set_http_server(http_server)
        tray.start()
        log.info("Dashboard: %s", DASHBOARD_URL)
        webbrowser.open(DASHBOARD_URL)

        # 5. Keep running until the user quits via the tray icon
        while True:
            if tray._stop_event.is_set() or not engine.running:
                break
            time.sleep(0.5)

    except Exception as exc:
        log.exception("Fatal error: %s", exc)
    finally:
        log.info("Shutting down...")
        if tray is not None:
            try:
                tray.stop()
            except Exception as exc:
                log.warning("Tray stop error: %s", exc)
        if http_server is not None:
            try:
                http_server.stop()
            except Exception as exc:
                log.warning("HTTP stop error: %s", exc)
        engine.stop()
        release_single_instance(mutex)
        log.info("Shutdown complete.")


if __name__ == "__main__":
    main()