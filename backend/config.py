"""
Cyber War Room - Backend Configuration
"""
import os
import sys


def _app_root():
    """Resolve the app root whether running from source or a PyInstaller bundle."""
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


APP_ROOT = _app_root()

# WebSocket server
WS_HOST = "127.0.0.1"
WS_PORT = 8765

# HTTP static server (serves the dashboard)
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 8080
STATIC_DIR = APP_ROOT

# Telemetry collection intervals (seconds)
COLLECTION_INTERVALS = {
    "system": 2,
    "network": 4,
    "processes": 5,
    "filesystem": 5,
    "registry": 10,
    "event_logs": 5,
}

# Detection thresholds
THRESHOLDS = {
    "cpu_high": 85.0,          # % CPU sustained
    "ram_high": 85.0,          # % RAM used
    "cpu_anomaly": 20.0,       # % deviation from baseline
    "failed_logins_alert": 5,  # in last 60s
    "new_process_alert": True,
    "suspicious_ports": [4444, 1337, 6667, 31337, 5555, 9999],
    "suspicious_process_names": [
        "mimikatz.exe", "mimikatz", "psexec.exe", "psexec", "wmiexec.exe", "wmiexec",
        "procdump.exe", "ps.exe", "nc.exe", "ncat.exe", "ncat", "pwdump.exe",
        "wce.exe", "fgdump.exe", "cain.exe", "hashcat.exe", "john.exe",
        "meterpreter", "teensy", "xc0re", "msfvenom$",
    ],
    "whitelist_processes": [
        "python.exe", "python3.exe", "python310.exe", "python311.exe",
        "python312.exe", "python313.exe", "chrome.exe", "msedge.exe",
        "firefox.exe", "explorer.exe", "winlogon.exe", "csrss.exe",
        "svchost.exe", "dwm.exe", "taskmgr.exe", "winrar.exe",
        "winword.exe", "excel.exe", "outlook.exe", "onenote.exe",
        "Notepad.exe", "cmd.exe", "powershell.exe", "pwsh.exe",
        "Conhost.exe", "openai.exe", "ollama.exe", "node.exe",
        "npm.cmd", "git.exe", "code.exe", "Code.exe", "msedgewebview2.exe",
        "WindowsTerminal.exe", "terminal.exe",
        # Common legitimate apps that may contain suspicious substrings
        "coredsync.exe", "wsccommunicator.exe", "omeninstallmonitor.exe",
        "spotify.exe", "discord.exe", "slack.exe", "teams.exe", "zoom.exe",
        "vscode.exe", "sublime_text.exe", "notepad++.exe", "winamp.exe",
    ],
}

# File monitoring
FILE_MONITOR = {
    "watch_dirs": [
        os.path.expanduser("~"),  # Home directory
    ],
    "sensitive_dirs": [
        r"C:\Windows\System32\config",
        r"C:\Windows\System32\drivers\etc",
        r"C:\ProgramData\Microsoft\Windows Defender",
    ],
    "ignore_dirs": [
        r"C:\Windows",
        os.path.expanduser("~") + r"\AppData\Local\Temp",
        os.path.expanduser("~") + r"\AppData\Local\Microsoft\Windows\INetCache",
    ],
    "suspicious_extensions": [".exe", ".dll", ".bat", ".ps1", ".vbs", ".scr", ".pif", ".cmd"],
    "suspicious_files": [
        "mimikatz.exe", "pwdump.exe", "wc.exe", "nc.exe", "wget.exe",
        "curl.exe", "telegram.exe",
    ],
}

# Windows event log queries
EVENT_LOG_QUERIES = {
    "failed_logins": "Security",
    "privilege_changes": "Security",
    "process_creation": "Microsoft-Windows-Sysmon/Operational",
}
