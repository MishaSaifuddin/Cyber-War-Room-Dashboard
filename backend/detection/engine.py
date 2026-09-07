"""
Cyber War Room - Detection Engine
Coordinates telemetry collection, rule application, and anomaly detection
"""
import threading
import time

from backend.detection.anomalies import detector
from backend.detection.rules import rules
from backend.telemetry.filesystem import collector as fs_collector
from backend.telemetry.network import collector as net_collector
from backend.telemetry.system import collector as sys_collector
from backend.telemetry.windows_logs import collector as log_collector


class DetectionEngine:
    """Main detection engine that orchestrates all monitoring."""

    def __init__(self):
        self.running = False
        self.lock = threading.Lock()
        self.last_telemetry = {}
        self.baseline_established = False
        self._last_fs_check = 0
        self._last_log_check = 0
        self._last_net_baseline = 0

    def start(self):
        """Start the detection engine."""
        if self.running:
            return
        self.running = True
        self._establish_baselines()
        self._collection_thread = threading.Thread(target=self._collection_loop, daemon=True)
        self._collection_thread.start()

    def stop(self):
        """Stop the detection engine."""
        self.running = False

    def _establish_baselines(self):
        """Establish baselines for anomaly and process detection."""
        try:
            # Baseline processes
            processes = sys_collector.get_processes()
            for proc in processes:
                if proc.get("name"):
                    rules.process_history.add(proc["name"].lower())

            # Baseline filesystem
            file_count = fs_collector.establish_baseline()
            if file_count > 0:
                self.baseline_established = True

            # Baseline network connections
            net_collector.establish_baseline()

            # Baseline system stats
            stats = sys_collector.get_system_stats()
            for _ in range(10):
                detector.add_sample("cpu", stats["cpu_percent"])
                detector.add_sample("ram", stats["ram_percent"])
                time.sleep(0.2)
        except Exception as e:
            print(f"[DetectionEngine] Baseline setup warning: {e}")

    def _collection_loop(self):
        """Main collection and detection loop."""
        while self.running:
            try:
                telemetry = self._collect_telemetry()
                with self.lock:
                    self.last_telemetry = telemetry

                # Run detection rules
                alerts = rules.check_all(telemetry)
                if alerts:
                    telemetry["alerts"] = alerts

                # Run anomaly detection
                system = telemetry.get("system", {})
                cpu_result = detector.check_anomaly("cpu", system.get("cpu_percent", 0))
                ram_result = detector.check_anomaly("ram", system.get("ram_percent", 0))

                # Add samples to detector
                detector.add_sample("cpu", system.get("cpu_percent", 0))
                detector.add_sample("ram", system.get("ram_percent", 0))

                anomalies = []
                if cpu_result[0]:
                    anomalies.append({
                        "type": "cpu_anomaly",
                        "detail": f"CPU deviation: {system.get('cpu_percent', 0)}% vs mean {cpu_result[2]:.1f}% (z-score: {cpu_result[1]:.1f})",
                        "severity": "HIGH" if cpu_result[1] > 4 else "MEDIUM",
                        "time": time.time(),
                    })
                if ram_result[0]:
                    anomalies.append({
                        "type": "ram_anomaly",
                        "detail": f"RAM deviation: {system.get('ram_percent', 0)}% vs mean {ram_result[2]:.1f}% (z-score: {ram_result[1]:.1f})",
                        "severity": "HIGH" if ram_result[1] > 4 else "MEDIUM",
                        "time": time.time(),
                    })

                if anomalies:
                    telemetry["anomalies"] = anomalies

                time.sleep(2)
            except Exception as e:
                print(f"[DetectionEngine] Error in collection loop: {e}")
                time.sleep(5)

    def _collect_telemetry(self):
        """Collect all telemetry data for a single snapshot."""
        now = time.time()

        # System stats (always collect)
        system = sys_collector.get_system_stats()
        baseline = sys_collector.get_baseline()

        # Processes (every 5s)
        processes = sys_collector.get_processes()

        # Network (every 4s)
        network = net_collector.get_network_stats()
        network["new_connections"] = net_collector.get_new_connections()

        # Filesystem (every 10s)
        filesystem = {
            "integrity_changes": [],
            "suspicious_files": [],
        }
        if now - self._last_fs_check > 10:
            try:
                filesystem["integrity_changes"] = fs_collector.check_integrity()
                filesystem["suspicious_files"] = fs_collector.scan_suspicious_files()
            except Exception as e:
                print(f"[DetectionEngine] File check warning: {e}")
            self._last_fs_check = now

        # Event logs (every 30s)
        logs = {
            "failed_logins": [],
            "privilege_changes": [],
        }
        if now - self._last_log_check > 30:
            try:
                logs["failed_logins"] = log_collector.get_failed_logins(lookback_seconds=60)
                logs["privilege_changes"] = log_collector.get_privilege_changes(lookback_seconds=120)
            except Exception as e:
                print(f"[DetectionEngine] Event log warning: {e}")
            self._last_log_check = now

        return {
            "system": system,
            "baseline": baseline,
            "processes": processes,
            "network": network,
            "filesystem": filesystem,
            "logs": logs,
            "system_info": sys_collector.get_system_info(),
            "timestamp": now,
        }

    def get_snapshot(self):
        """Get the current telemetry snapshot with alert data."""
        with self.lock:
            telemetry = dict(self.last_telemetry)

        telemetry["system_info"] = sys_collector.get_system_info()
        telemetry["alerts"] = rules.get_active_alerts()
        telemetry["alert_history"] = rules.get_alert_history(20)
        telemetry["anomalies"] = detector.get_active_anomalies()
        telemetry["anomaly_stats"] = detector.get_anomaly_stats()
        telemetry["os_available"] = log_collector.is_available()

        # Security score computation
        telemetry["security_score"] = self._compute_security_score(telemetry)
        telemetry["threat_level"] = self._compute_threat_level(telemetry)

        return telemetry

    def wait_for_data(self, timeout=10):
        """Block until the first telemetry snapshot is available.
        Returns True if data is ready, False on timeout.
        """
        elapsed = 0
        while elapsed < timeout:
            with self.lock:
                if self.last_telemetry:
                    return True
            time.sleep(0.2)
            elapsed += 0.2
        return False

    def _compute_security_score(self, telemetry):
        """Compute a 0-100 security score based on current state."""
        score = 90  # Start at 90

        # Deduct for active alerts
        alerts = telemetry.get("alerts", [])
        for alert in alerts:
            severity = alert.get("severity", "LOW")
            if severity == "CRITICAL":
                score -= 8
            elif severity == "HIGH":
                score -= 5
            elif severity == "MEDIUM":
                score -= 3
            else:
                score -= 1

        # Deduct for anomalies
        anomalies = telemetry.get("anomalies", [])
        score -= len(anomalies) * 2

        # Deduct for suspicious files
        suspicious = telemetry.get("filesystem", {}).get("suspicious_files", [])
        score -= len(suspicious) * 4

        # Deduct for integrity changes
        integrity = telemetry.get("filesystem", {}).get("integrity_changes", [])
        score -= len(integrity) * 3

        # Deduct for high resource usage
        system = telemetry.get("system", {})
        if system.get("cpu_percent", 0) > 85:
            score -= 5
        if system.get("ram_percent", 0) > 85:
            score -= 5

        return max(0, min(100, int(score)))

    def _compute_threat_level(self, telemetry):
        """Compute a 0-100 threat level based on current state."""
        threat = 10  # Low baseline

        # Add for active alerts
        alerts = telemetry.get("alerts", [])
        for alert in alerts:
            severity = alert.get("severity", "LOW")
            if severity == "CRITICAL":
                threat += 12
            elif severity == "HIGH":
                threat += 8
            elif severity == "MEDIUM":
                threat += 5
            else:
                threat += 2

        # Add for anomalies
        anomalies = telemetry.get("anomalies", [])
        threat += len(anomalies) * 5

        # Add for suspicious files
        suspicious = telemetry.get("filesystem", {}).get("suspicious_files", [])
        threat += len(suspicious) * 8

        # Add for integrity changes
        integrity = telemetry.get("filesystem", {}).get("integrity_changes", [])
        threat += len(integrity) * 6

        # Add for resource spikes
        system = telemetry.get("system", {})
        if system.get("cpu_percent", 0) > 90:
            threat += 10
        elif system.get("cpu_percent", 0) > 80:
            threat += 5

        return max(0, min(100, int(threat)))


engine = DetectionEngine()
