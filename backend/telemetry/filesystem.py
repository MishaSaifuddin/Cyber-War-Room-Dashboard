"""
Cyber War Room - Filesystem Telemetry Collector
Monitors file changes, sensitive directories, and suspicious file activity
"""
import hashlib
import os
import time

import psutil

from backend.config import FILE_MONITOR


class FilesystemCollector:
    """Monitors filesystem changes and integrity."""

    def __init__(self):
        self._file_hashes = {}
        self._monitored_files = []
        self._watch_dirs = FILE_MONITOR["watch_dirs"]
        self._ignore_dirs = FILE_MONITOR["ignore_dirs"]
        self._suspicious_exts = FILE_MONITOR["suspicious_extensions"]
        self._suspicious_files = FILE_MONITOR["suspicious_files"]
        self._events = []
        self._baseline_established = False
        self._scan_interval = 5

    def establish_baseline(self):
        """Scan sensitive directories and calculate file hashes."""
        sensitive_dirs = FILE_MONITOR["sensitive_dirs"]
        for directory in sensitive_dirs:
            if os.path.exists(directory):
                self._scan_directory(directory)
        self._baseline_established = True
        return len(self._monitored_files)

    def _scan_directory(self, directory, depth=0):
        """Recursively scan a directory and hash sensitive files."""
        if depth > 3:
            return

        try:
            for entry in os.scandir(directory):
                if entry.is_file():
                    # Only hash files that could be tampered with
                    if any(entry.name.lower().endswith(ext) for ext in FILE_MONITOR["suspicious_extensions"]):
                        self._hash_file(entry.path)
                    elif depth == 0 and entry.name in ("hosts", "LMHOSTS", "hostname"):
                        self._hash_file(entry.path)
                elif entry.is_dir() and depth < 3:
                    self._scan_directory(entry.path, depth + 1)
        except (PermissionError, OSError):
            pass

    def _hash_file(self, path):
        """Hash a file for integrity checking."""
        try:
            with open(path, "rb") as f:
                digest = hashlib.sha256()
                for chunk in iter(lambda: f.read(65536), b""):
                    digest.update(chunk)
            self._file_hashes[path] = digest.hexdigest()
            self._monitored_files.append(path)
        except (PermissionError, OSError, IsADirectoryError):
            pass

    def check_integrity(self):
        """Check for changes to monitored files."""
        changes = []
        for path, expected_hash in list(self._file_hashes.items()):
            if not os.path.exists(path):
                changes.append({"path": path, "type": "deleted"})
                del self._file_hashes[path]
            else:
                try:
                    with open(path, "rb") as f:
                        digest = hashlib.sha256()
                        for chunk in iter(lambda: f.read(65536), b""):
                            digest.update(chunk)
                    current_hash = digest.hexdigest()
                    if current_hash != expected_hash:
                        changes.append({"path": path, "type": "modified"})
                        self._file_hashes[path] = current_hash
                except (PermissionError, OSError):
                    continue
        return changes

    def scan_suspicious_files(self, max_depth=4, max_files=100000):
        """Scan watch directories for newly created suspicious files.
        Bounded to avoid long walks over huge directories.
        """
        suspicious = []

        # Only scan high-value user directories (not the entire home tree)
        home = os.path.expanduser("~")
        scan_roots = [
            home,
        ]
        # Exclude massive/noisy directories
        hard_ignore = {
            os.path.join(home, "AppData"),
            os.path.join(home, ".cache"),
            os.path.join(home, ".git"),
            "node_modules",
            ".venv",
            "venv",
        }

        file_count = 0
        for root_dir in scan_roots:
            if not os.path.exists(root_dir):
                continue
            for root, dirs, files in os.walk(root_dir):
                # Respect max depth
                rel = os.path.relpath(root, root_dir)
                depth = 0 if rel == "." else rel.count(os.sep) + 1
                if depth > max_depth:
                    dirs[:] = []
                    continue

                # Prune ignored directories
                pruned = []
                for d in dirs:
                    full = os.path.join(root, d).lower()
                    if any(exc.lower() in full for exc in hard_ignore):
                        continue
                    pruned.append(d)
                dirs[:] = pruned

                for filename in files:
                    file_count += 1
                    if file_count > max_files:
                        return suspicious

                    filepath = os.path.join(root, filename)
                    try:
                        mtime = os.path.getmtime(filepath)

                        is_suspicious_name = filename.lower() in self._suspicious_files
                        is_suspicious_ext = False
                        if "." in filename:
                            ext = filename.lower().rsplit(".", 1)[-1]
                            is_suspicious_ext = f".{ext}" in self._suspicious_exts

                        # Flag recently created suspicious files (within 300s)
                        if (is_suspicious_name or is_suspicious_ext) and (time.time() - mtime) < 300:
                            suspicious.append({
                                "path": filepath,
                                "name": filename,
                                "created": int(mtime),
                                "size": os.path.getsize(filepath),
                                "reason": "suspicious_name" if is_suspicious_name else "suspicious_extension",
                            })
                            if len(suspicious) >= 20:
                                return suspicious
                    except (PermissionError, OSError):
                        continue

        return suspicious[:20]

    def get_recent_files(self, limit=20):
        """Get most recently modified files (bounded walk)."""
        recent = []
        home = os.path.expanduser("~")
        scan_roots = [home]
        hard_ignore = {
            os.path.join(home, "AppData"),
            ".git",
            "node_modules",
        }

        file_count = 0
        for root_dir in scan_roots:
            if not os.path.exists(root_dir):
                continue
            try:
                for root, dirs, files in os.walk(root_dir):
                    rel = os.path.relpath(root, root_dir)
                    depth = 0 if rel == "." else rel.count(os.sep) + 1
                    if depth > 4:
                        dirs[:] = []
                        continue

                    pruned = []
                    for d in dirs:
                        full = os.path.join(root, d).lower()
                        if any(exc.lower() in full for exc in hard_ignore):
                            continue
                        pruned.append(d)
                    dirs[:] = pruned

                    for filename in files:
                        file_count += 1
                        if file_count > 100000:
                            recent.sort(key=lambda f: f["modified"], reverse=True)
                            return recent[:limit]

                        filepath = os.path.join(root, filename)
                        try:
                            mtime = os.path.getmtime(filepath)
                            if time.time() - mtime < 300:  # last 5 minutes
                                recent.append({
                                    "path": filepath,
                                    "name": filename,
                                    "modified": mtime,
                                    "size": os.path.getsize(filepath),
                                })
                        except (PermissionError, OSError):
                            continue
            except (PermissionError, OSError):
                continue
        recent.sort(key=lambda f: f["modified"], reverse=True)
        return recent[:limit]


collector = FilesystemCollector()
