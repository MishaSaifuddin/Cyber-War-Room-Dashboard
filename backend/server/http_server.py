"""
Cyber War Room - HTTP Static File Server
Serves the dashboard HTML/CSS/JS files
"""
import http.server
import os
import socketserver
import threading


class CyberWarRoomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with proper content types and no-cache."""
    server_version = "WarRoom/1.0"

    def __init__(self, *args, directory=".", **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format, *args):
        # Silent logging to avoid console spam
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


class HTTPServer:
    """Wraps the HTTP static server for the dashboard."""

    def __init__(self, host, port, static_dir):
        self.host = host
        self.port = port
        self.static_dir = static_dir
        self.httpd = None
        self.thread = None

    def start(self):
        """Start the HTTP server in a background thread."""
        handler = lambda *args, **kwargs: CyberWarRoomHTTPHandler(
            *args, directory=self.static_dir, **kwargs
        )
        self.httpd = socketserver.ThreadingTCPServer((self.host, self.port), handler)
        self.httpd.daemon_threads = True
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        print(f"[HTTP] Dashboard serving at http://{self.host}:{self.port}/index.html")
        return self.thread

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
