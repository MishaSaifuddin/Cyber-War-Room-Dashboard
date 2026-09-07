"""
Cyber War Room - Windows Event Log Collector
Reads Windows security event logs for failed logins, privilege changes, etc.
Uses wevtutil (built into Windows) for compatibility - no admin needed for basic queries.
"""
import json
import shlex
import subprocess
import time
from datetime import datetime, timedelta


class WindowsEventLogCollector:
    """Reads Windows Security event logs for security monitoring."""

    def __init__(self):
        self._failed_logins = []
        self._last_check = 0
        self._available = True
        self._test_availability()

    def _test_availability(self):
        """Check if we can access the Windows event log."""
        try:
            result = subprocess.run(
                ["wevtutil", "gl", "Security"],
                capture_output=True, text=True, timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
            )
            self._available = result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            self._available = False

    def is_available(self):
        """Whether the Windows event log is accessible."""
        return self._available

    def get_failed_logins(self, lookback_seconds=120):
        """Get recent failed login events (Event ID 4625)."""
        if not self._available:
            return []

        events = []
        try:
            # Query Security log for ID 4625 in the last N seconds
            # wevtutil query needs XML query format
            start_time = datetime.now() - timedelta(seconds=lookback_seconds)
            query_start = start_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")

            xml_query = (
                '<QueryList>'
                '  <Query Id="0" Path="Security">'
                f'    <Select Path="Security">*[System[(EventID=4625) and TimeCreated[timediff(@SystemTime) &lt;= {lookback_seconds * 1000}]]]</Select>'
                '  </Query>'
                '</QueryList>'
            )

            # Use PowerShell to query the event log (more reliable)
            ps_script = (
                "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; "
                "StartTime=(Get-Date).AddSeconds(-" + str(lookback_seconds) + ")} -MaxEvents 50 "
                "-ErrorAction SilentlyContinue | "
                "ForEach-Object { [PSCustomObject]@{ "
                "Time=$_.TimeCreated; "
                "Message=$_.Message; "
                "IpAddress=($_.Properties | Where-Object {$_.Index -eq 18} | Select-Object -First 1).Value; "
                "Username=($_.Properties | Where-Object {$_.Index -eq 5} | Select-Object -First 1).Value "
                "} } | ConvertTo-Json"
            )

            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_script],
                capture_output=True, text=True, timeout=15,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
            )

            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if isinstance(data, list):
                    for item in data:
                        events.append({
                            "time": item.get("Time", ""),
                            "username": item.get("Username", "unknown"),
                            "source_ip": item.get("IpAddress", "unknown"),
                            "event_id": 4625,
                        })
                elif isinstance(data, dict):
                    events.append({
                        "time": data.get("Time", ""),
                        "username": data.get("Username", "unknown"),
                        "source_ip": data.get("IpAddress", "unknown"),
                        "event_id": 4625,
                    })
        except (Exception, subprocess.TimeoutExpired) as e:
            pass

        return events

    def get_privilege_changes(self, lookback_seconds=300):
        """Get recent privilege changes (Event ID 4672 - special privileges assigned)."""
        if not self._available:
            return []

        events = []
        try:
            ps_script = (
                "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4672; "
                "StartTime=(Get-Date).AddSeconds(-" + str(lookback_seconds) + ")} -MaxEvents 20 "
                "-ErrorAction SilentlyContinue | "
                "ForEach-Object { [PSCustomObject]@{ "
                "Time=$_.TimeCreated; "
                "Username=$_.Properties[1].Value "
                "} } | ConvertTo-Json"
            )

            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_script],
                capture_output=True, text=True, timeout=15,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
            )

            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                if isinstance(data, list):
                    for item in data:
                        events.append({
                            "time": item.get("Time", ""),
                            "username": item.get("Username", "unknown"),
                            "event_id": 4672,
                        })
        except Exception:
            pass

        return events

    def get_security_events(self, event_id=4625, max_events=10):
        """Generic method to get security events."""
        if not self._available:
            return []

        try:
            ps_script = (
                f"Get-WinEvent -FilterHashtable @{{LogName='Security'; Id={event_id}}} "
                f"-MaxEvents {max_events} -ErrorAction SilentlyContinue | "
                "ForEach-Object { [PSCustomObject]@{ "
                "Time=$_.TimeCreated; "
                "Message=$_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)) "
                "} } | ConvertTo-Json"
            )

            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_script],
                capture_output=True, text=True, timeout=15,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
            )

            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                events_list = data if isinstance(data, list) else [data]
                return [{"time": e.get("Time", ""), "message": e.get("Message", ""), "event_id": event_id} for e in events_list]
        except Exception:
            pass

        return []


collector = WindowsEventLogCollector()
