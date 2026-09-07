"""
Cyber War Room - Detection Rules
Rule-based detection engine for known threats
"""
import time

from backend.config import THRESHOLDS


class DetectionRules:
    """Applies rule-based detection to telemetry data."""

    def __init__(self):
        self.active_alerts = []
        self.alert_history = []
        self.last_cpu_check = 0
        self.sustained_cpu_high = False
        self.process_history = set()
        self.last_failed_logins = 0

    def check_all(self, data):
        """
        Run all detection rules against the latest telemetry.
        data = {system, network, processes, filesystem, logs, baseline}
        Returns: list of alerts/incidents
        """
        alerts = []

        system = data.get("system", {})
        network = data.get("network", {})
        processes = data.get("processes", [])
        filesystem = data.get("filesystem", {})
        logs = data.get("logs", {})
        baseline = data.get("baseline", {})

        # 1. CPU anomaly detection
        cpu_result = self.check_cpu(system, baseline)
        if cpu_result:
            alerts.extend(cpu_result)

        # 2. RAM anomaly
        ram_result = self.check_ram(system, baseline)
        if ram_result:
            alerts.extend(ram_result)

        # 3. Suspicious processes
        process_results = self.check_processes(processes)
        if process_results:
            alerts.extend(process_results)

        # 4. Suspicious ports (scanning listening ports)
        port_results = self.check_ports(network)
        if port_results:
            alerts.extend(port_results)

        # 5. Failed login detection
        login_results = self.check_failed_logins(logs)
        if login_results:
            alerts.extend(login_results)

        # 6. File integrity changes
        file_results = self.check_file_changes(filesystem)
        if file_results:
            alerts.extend(file_results)

        # 7. Suspicious files created
        suspicious_files = self.check_suspicious_files(filesystem)
        if suspicious_files:
            alerts.extend(suspicious_files)

        # New connections
        new_conns = self.check_new_connections(network)
        if new_conns:
            alerts.extend(new_conns)

        # Update active alerts (deduplicate)
        self._merge_alerts(alerts)

        return alerts

    def check_cpu(self, system, baseline):
        """Alert on sustained high CPU usage or anomaly."""
        alerts = []
        cpu = system.get("cpu_percent", 0)
        cpu_avg = baseline.get("cpu_avg", 0)

        # Sustained high CPU
        if cpu > THRESHOLDS["cpu_high"]:
            self.last_cpu_check = time.time() if self.last_cpu_check == 0 else self.last_cpu_check
            if time.time() - self.last_cpu_check > 10:  # sustained for 10s
                alerts.append(self._create_alert(
                    "HIGH_CPU",
                    "CRITICAL",
                    f"CPU usage at {cpu}% exceeds critical threshold ({THRESHOLDS['cpu_high']}%)",
                ))
        else:
            self.last_cpu_check = 0

        # Anomaly detection (significant deviation from baseline)
        if cpu_avg and abs(cpu - cpu_avg) > THRESHOLDS["cpu_anomaly"] and cpu > 60:
            alerts.append(self._create_alert(
                "CPU_ANOMALY",
                "HIGH",
                f"CPU usage ({cpu}%) significantly deviates from baseline ({cpu_avg}%)",
            ))
        return alerts

    def check_ram(self, system, baseline):
        """Alert on high RAM usage or anomaly."""
        alerts = []
        ram = system.get("ram_percent", 0)
        ram_avg = baseline.get("ram_avg", 0)

        if ram > THRESHOLDS["ram_high"]:
            alerts.append(self._create_alert(
                "HIGH_RAM",
                "HIGH",
                f"RAM usage at {ram}% exceeds critical threshold ({THRESHOLDS['ram_high']}%)",
            ))
        return alerts

    def check_processes(self, processes):
        """Alert on suspicious or whitelist-violating processes."""
        alerts = []
        if not processes:
            return alerts

        current_processes = set()
        for proc in processes:
            name = proc["name"].lower()
            cmdline = (proc.get("cmdline") or "").lower()
            current_processes.add(name)

            # Check for known suspicious process names
            # Use exact name match (case-insensitive) or full cmdline contains
            proc_name_lower = name
            for suspicious in THRESHOLDS["suspicious_process_names"]:
                # Exact filename match OR the suspicious string as a whole token in cmdline
                if proc_name_lower == suspicious:
                    alerts.append(self._create_alert(
                        "SUSPICIOUS_PROCESS",
                        "CRITICAL" if suspicious in ["mimikatz", "meterpreter", "pwsh.exe", "mimikatz.exe"] else "HIGH",
                        f"Suspicious process detected: {proc['name']} (PID {proc['pid']}) - matches '{suspicious}'",
                    ))
                elif ' ' + suspicious in ' ' + cmdline or suspicious in cmdline.split():
                    # Check if it's used as a standalone command in the cmdline
                    toks = [t.strip('\",\'') for t in cmdline.split()]
                    if suspicious in toks:
                        alerts.append(self._create_alert(
                            "SUSPICIOUS_PROCESS",
                            "HIGH",
                            f"Suspicious command detected in process {proc['name']}: '{suspicious}'",
                        ))

            # Check for processes consuming suspiciously high CPU
            if proc.get("cpu_percent", 0) > 90:
                alerts.append(self._create_alert(
                    "HIGH_PROCESS_CPU",
                    "MEDIUM",
                    f"Process {proc['name']} (PID {proc['pid']}) using {proc['cpu_percent']}% CPU",
                ))

        # New process detection (vs whitelist)
        if self.process_history:
            new_processes = current_processes - self.process_history
            for new_proc in new_processes:
                # Alert on new processes that aren't in the whitelist
                if new_proc.lower() not in [p.lower() for p in THRESHOLDS["whitelist_processes"]]:
                    alerts.append(self._create_alert(
                        "NEW_PROCESS",
                        "MEDIUM",
                        f"New process detected: '{new_proc}' (not in whitelist)",
                    ))
        else:
            # First run - just establish baseline
            for proc in processes:
                self.process_history.add(proc["name"].lower())

        self.process_history = current_processes.copy()

        return alerts

    def check_ports(self, network):
        """Alert on suspicious open ports."""
        alerts = []
        listening_ports = network.get("listening_ports", [])

        for port_info in listening_ports:
            if port_info["port"] in THRESHOLDS["suspicious_ports"]:
                alerts.append(self._create_alert(
                    "SUSPICIOUS_PORT",
                    "HIGH",
                    f"Suspicious port {port_info['port']} is listening (process: {port_info['process']})",
                ))

        return alerts

    def check_failed_logins(self, logs):
        """Alert on failed login attempts."""
        alerts = []
        failed_logins = logs.get("failed_logins", [])

        if failed_logins:
            count = len(failed_logins)
            if count >= THRESHOLDS["failed_logins_alert"]:
                sources = set(l.get("source_ip", "unknown") for l in failed_logins)
                alerts.append(self._create_alert(
                    "FAILED_LOGINS",
                    "HIGH" if count >= 10 else "MEDIUM",
                    f"{count} failed login{'s' if count > 1 else ''} detected (sources: {', '.join(sources)})",
                ))

        return alerts

    def check_file_changes(self, filesystem):
        """Alert on changes to monitored system files."""
        alerts = []
        changes = filesystem.get("integrity_changes", [])

        for change in changes:
            path = change.get("path", "")
            change_type = change.get("type", "modified")
            alerts.append(self._create_alert(
                "FILE_INTEGRITY",
                "HIGH",
                f"File {change_type}: {path}",
            ))

        return alerts

    def check_suspicious_files(self, filesystem):
        """Alert on newly created suspicious files."""
        alerts = []
        suspicious = filesystem.get("suspicious_files", [])

        for sf in suspicious:
            alerts.append(self._create_alert(
                "SUSPICIOUS_FILE",
                "HIGH",
                f"Suspicious file created: {sf.get('name', '')} at {sf.get('path', '')}",
            ))

        return alerts

    def check_new_connections(self, network):
        """Alert on new remote connections (potential C2)."""
        alerts = []
        new_connections = network.get("new_connections", [])

        # Limit alerts to avoid flooding
        for conn in new_connections[:3]:
            alerts.append(self._create_alert(
                "NEW_CONNECTION",
                "LOW",
                f"New connection to {conn.get('ip', 'unknown')}:{conn.get('port', 0)}",
            ))

        return alerts

    def _create_alert(self, rule, severity, message):
        """Create a standardized alert object."""
        now = time.time()
        return {
            "rule": rule,
            "severity": severity,
            "message": message,
            "time": now,
            "source": "DETECTION_ENGINE",
            "id": f"{rule}-{int(hash(message) % 100000)}",
        }

    def _merge_alerts(self, new_alerts):
        """Merge new alerts into active list, removing duplicates."""
        existing_ids = set(a["id"] for a in self.active_alerts)

        for alert in new_alerts:
            if alert["id"] not in existing_ids:
                self.active_alerts.append(alert)
                self.alert_history.append(alert)
                existing_ids.add(alert["id"])

        # Auto-dismiss alerts older than 60 seconds
        current_time = time.time()
        self.active_alerts = [
            a for a in self.active_alerts
            if current_time - a["time"] < 60
        ]

        # Keep only last 100 alerts in history
        if len(self.alert_history) > 100:
            self.alert_history = self.alert_history[-100:]

    def get_active_alerts(self):
        """Get currently active alerts."""
        return self.active_alerts

    def get_alert_history(self, limit=50):
        """Get alert history."""
        return self.alert_history[-limit:]


rules = DetectionRules()
