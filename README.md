# 🛡️ CYBER WAR ROOM - Security Operations Dashboard
![Cyber War Room Dashboard](assets/https://github.com/MishaSaifuddin/Cyber-War-Room-Dashboard/blob/main/CWR.png)

A centralized cybersecurity War Room dashboard that monitors **your actual computer** in real-time, detecting security threats like suspicious processes, attacks, file changes, and system anomalies - alongside a comprehensive monitoring interface.

## Two Modes

### 🔴 LIVE MODE (Real Detection)
Monitors your actual laptop using a Python backend. Detects real threats on your system:

| Detection | What it looks for |
|---|---|
| **HIGH CPU** | CPU sustained over 85% |
| **HIGH RAM** | Memory usage over 85% |
| **CPU/RAM anomaly** | Statistical deviation from baseline (z-score) |
| **Suspicious processes** | mimikatz, psexec, nc, ncat, meterpreter, etc. |
| **New (non-whitelisted) processes** | Processes not in the known-good list |
| **Suspicious open ports** | Ports 4444, 1337, 31337, etc. (C2 relays) |
| **Failed logins** | Windows Security event log (Event ID 4625) |
| **Privilege escalation** | Windows Security event log (Event ID 4672) |
| **File integrity changes** | Changes to System32 config, hosts file |
| **Suspicious new files** | New .exe/.dll/.ps1/.bat files created recently |
| **New network connections** | New outbound connections against baseline |

### 🟢 MOCK MODE (Simulation)
Generates realistic simulated attacks and metrics for demos/training. No backend needed.

---

## 💻 Desktop App (Offline, no install needed)

Prefer a double-click tool? Build the standalone exe — it bundles Python, all
dependencies, the dashboard, and the icon into one portable file. No Python or
internet needed to run it.

### Quick build (one time, needs Python)
```
pip install pyinstaller pystray
pyinstaller war_room.spec --noconfirm
```
The exe lands in `dist/CyberWarRoom.exe`. Double-click it (or pin to taskbar /
send a shortcut to your desktop for a nice icon).

### What it does when you click it
- Starts the detection engine + HTTP + WebSocket servers (all offline/local)
- Opens the dashboard automatically in your browser
- Shows a system tray icon: **Open Dashboard** / **Quit**
- Logs activity to `war_room.log` next to the exe
- No console window; runs silently in the background until you Quit

### Build from source (instead of the spec)
```
pyinstaller --onefile --windowed --icon assets/war_room.ico \
    --add-data "index.html;." --add-data "css;css" --add-data "js;js" \
    --add-data "assets/war_room.ico;assets" --add-data "assets/war_room.png;assets" \
    backend/desktop_launcher.py --name CyberWarRoom
```

The icon generator (`icon_generator.py`) recreates `assets/war_room.ico` if you
want to customize the look.

---

## ⚡ Quick Start (From Source / Live Detection)

### 1. Install dependencies (one time)
```
pip install psutil websockets
```

### 2. Start the backend
```
start_backend.bat        # Windows
# OR
python backend/main.py
```

This starts:
- **HTTP server** at `http://127.0.0.1:8080` (serves the dashboard)
- **WebSocket server** at `ws://127.0.0.1:8765` (streams live telemetry)

### 3. Open the dashboard
Navigate to **http://127.0.0.1:8080/index.html**

The dashboard automatically connects to the WebSocket. When connected, mode shows **LIVE** in the top-right. To just view the mock version, open `index.html` directly from the file system (no backend running).

---

## 🖥️ Dashboard Sections

1. **Network Health** - Real network connections, listening ports, traffic rates
2. **Security Health** - Live security score from detected threats (0-100)
3. **Suspicious Activities** - Live feed of detected threats (real, from your system!)
4. **System Status** - Your actual CPU/RAM/disk and top processes
5. **Incidents** - Detected alerts as incidents with severity
6. **Critical Assets** - Your system components & suspicious files detected
7. **User Activities** - Windows login events, failed logins, privilege changes
8. **Threat Levels** - Real-time threat gauge calculated from detections
9. **Operational Readiness** - Monitoring capability and system health

---

## 🏗️ Architecture

```
cyber-war-room-dashboard/
├── index.html                 # Dashboard UI
├── css/                       # Styles (dark war room theme)
├── js/
│   ├── utils/                 # helpers, charts, wsClient
│   ├── data/                  # mockData, apiService, dataManager
│   ├── components/            # 10 dashboard components
│   └── app.js                 # Entry point
│
└── backend/                   # Python detection backend
    ├── main.py                # Entry point (starts servers)
    ├── config.py              # Thresholds & monitoring config
    ├── telemetry/
    │   ├── system.py          # CPU, RAM, disk, processes (psutil)
    │   ├── network.py         # Ports, connections, bandwidth
    │   ├── filesystem.py      # File integrity & suspicious files
    │   └── windows_logs.py    # Windows security events (Event IDs)
    ├── detection/
    │   ├── rules.py           # Rule-based detection engine
    │   ├── anomalies.py       # Statistical anomaly detection
    │   └── engine.py          # Orchestrates everything
    └── server/
        ├── http_server.py     # Serves the dashboard (port 8080)
        └── ws_server.py       # Streams telemetry (port 8765)
```

---

## ⚙️ Configuration

Edit `backend/config.py` to tune:

- **THRESHOLDS** - Alert thresholds (CPU%, RAM%, failed logins)
- **whitelist_processes** - Add your trusted apps to suppress false alerts
- **suspicious_process_names** - Known bad tools to watch for
- **suspicious_ports** - Ports that indicate C2/backdoors

You can also add your own apps to the whitelist as you use the system) to reduce false positives.

---

## 🔍 Understanding Alerts

- **HIGH_RAM / HIGH_CPU** - Your system resources are under pressure (could be an attack or just heavy usage)
- **SUSPICIOUS_PROCESS** - A known hacking tool (mimikatz, netcat, etc.) is running
- **NEW_PROCESS** - A program started that isn't in the whitelist
- **SUSPICIOUS_PORT** - A port commonly used by malware is listening
- **FAILED_LOGINS** - Multiple failed login attempts (Event 4625)
- **FILE_INTEGRITY** - A monitored system file changed
- **SUSPICIOUS_FILE** - A new executable/script appeared recently

---

## 🎨 Features

- Dark military war room theme with CRT scanlines
- Real-time WebSocket streaming from your machine
- Automatic fallback to mock mode when no backend detected
- Custom canvas-drawn charts (no external libraries)
- DEFCON-style threat level indicator
- Keyboard shortcuts: `F` fullscreen, `M` refresh status
- Responsive design

---

**Version:** 2.0.0  
**License:** MIT  
**© 2026**
