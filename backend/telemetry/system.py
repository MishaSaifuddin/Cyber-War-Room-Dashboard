"""
Cyber War Room - System Telemetry Collector
Gathers CPU, RAM, disk, processes, and system info from the host machine
"""
import os
import platform
import socket
import time
import uuid

import psutil


class SystemCollector:
    """Collects system-level telemetry data."""

    def __init__(self):
        self.hostname = socket.gethostname()
        self.username = os.getlogin() if hasattr(os, "getlogin") else os.environ.get("USERNAME", "unknown")
        self.baselines = {
            "cpu_avg": None,
            "ram_avg": None,
            "sys_uptime": 0,
            "cpu_samples": [],
            "ram_samples": [],
        }

    def get_system_info(self):
        """Get static system information for the assets panel."""
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        uptime_days = int(uptime_seconds // 86400)
        uptime_rest = int(uptime_seconds % 86400)
        uptime_hours = uptime_rest // 3600
        uptime_mins = (uptime_rest % 3600) // 60

        return {
            "hostname": self.hostname,
            "username": self.username,
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "cpu_cores": psutil.cpu_count(logical=True),
            "physical_cores": psutil.cpu_count(logical=False),
            "total_ram": psutil.virtual_memory().total,
            "boot_time": boot_time,
            "uptime_string": f"{uptime_days}d {uptime_hours}h {uptime_mins}m",
            "uptime_seconds": uptime_seconds,
            "machine_id": uuid.getnode(),
        }

    def get_system_stats(self):
        """Get current CPU, RAM, and disk usage."""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        disk = psutil.disk_usage(os.path.expanduser("~") if os.name == "nt" else "/")

        # Update baseline samples
        self.baselines["cpu_samples"].append(cpu_percent)
        self.baselines["ram_samples"].append(mem.percent)
        if len(self.baselines["cpu_samples"]) > 30:
            self.baselines["cpu_samples"].pop(0)
        if len(self.baselines["ram_samples"]) > 30:
            self.baselines["ram_samples"].pop(0)

        return {
            "cpu_percent": round(cpu_percent, 1),
            "cpu_count": psutil.cpu_count(),
            "ram_percent": round(mem.percent, 1),
            "ram_used": mem.used,
            "ram_total": mem.total,
            "ram_available": mem.available,
            "swap_percent": round(swap.percent, 1),
            "disk_percent": round(disk.percent, 1),
            "disk_used": disk.used,
            "disk_total": disk.total,
            "disk_free": disk.free,
            "load_avg": None,
            "temperature": self._get_temperature(),
        }

    def get_baseline(self):
        """Calculate a baseline from collected samples for anomaly detection."""
        cpu_samples = self.baselines["cpu_samples"]
        ram_samples = self.baselines["ram_samples"]
        if cpu_samples:
            self.baselines["cpu_avg"] = sum(cpu_samples) / len(cpu_samples)
        if ram_samples:
            self.baselines["ram_avg"] = sum(ram_samples) / len(ram_samples)
        return {
            "cpu_avg": round(self.baselines["cpu_avg"] or 0, 1),
            "ram_avg": round(self.baselines["ram_avg"] or 0, 1),
        }

    def get_processes(self):
        """Get list of running processes for monitoring."""
        processes = []
        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "username", "cmdline", "create_time"]):
            try:
                info = proc.info
                processes.append({
                    "pid": info["pid"],
                    "name": info["name"] or "unknown",
                    "cpu_percent": round(info["cpu_percent"] or 0, 1),
                    "memory_percent": round(info["memory_percent"] or 0, 2),
                    "username": info["username"] or "system",
                    "cmdline": " ".join(info["cmdline"] or [])[:200],
                    "created": int(info["create_time"] or 0),
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        processes.sort(key=lambda p: p["cpu_percent"], reverse=True)
        return processes

    def _get_temperature(self):
        """Get CPU temperature if available (may not work on all systems)."""
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if not temps:
                    return None
                for key, readings in temps.items():
                    if readings:
                        return round(readings[0].current, 1)
        except Exception:
            pass
        return None


collector = SystemCollector()
