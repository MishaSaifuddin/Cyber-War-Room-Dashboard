"""
Cyber War Room - Network Telemetry Collector
Gathers open ports, active connections, and bandwidth usage
"""
import time

import psutil


class NetworkCollector:
    """Collects network telemetry data."""

    def __init__(self):
        self._last_bytes = None
        self._last_time = None
        self._baseline_connections = set()
        self._baseline_established = False

    def get_network_stats(self):
        """Get network connection and traffic statistics."""
        net_io = psutil.net_io_counters()
        connections = self.get_connections()
        addrs = psutil.net_if_addrs()
        stats = psutil.net_if_stats()

        # Interface list
        interfaces = []
        for iface, addresses in addrs.items():
            iface_info = {
                "name": iface,
                "up": bool(stats.get(iface, None).isup if stats.get(iface, None) else False),
                "addresses": [],
            }
            for addr in addresses:
                if addr.family.name == "AF_INET":  # IPv4
                    iface_info["addresses"].append({"ip": addr.address, "type": "ipv4"})
                elif addr.family.name == "AF_LINK" or "AF_PACKET" in str(addr.family.name):
                    iface_info["addresses"].append({"mac": addr.address, "type": "mac"})
            interfaces.append(iface_info)

        # Bandwidth calculation
        current_time = time.time()
        in_rate = out_rate = 0
        if self._last_bytes is not None and self._last_time is not None:
            elapsed = current_time - self._last_time
            if elapsed > 0:
                in_bytes = net_io.bytes_recv - self._last_bytes.bytes_recv
                out_bytes = net_io.bytes_sent - self._last_bytes.bytes_sent
                in_rate = in_bytes / elapsed * 8  # bits per second
                out_rate = out_bytes / elapsed * 8

        self._last_bytes = net_io
        self._last_time = current_time

        return {
            "interfaces": interfaces,
            "connections": connections,
            "total_connections": len(connections),
            "listening_ports": self.get_listening_ports(),
            "in_rate": in_rate,
            "out_rate": out_rate,
            "bytes_recv": net_io.bytes_recv,
            "bytes_sent": net_io.bytes_sent,
            "packets_recv": net_io.packets_recv,
            "packets_sent": net_io.packets_sent,
            "errin": net_io.errin,
            "errout": net_io.errout,
            "dropin": net_io.dropin,
            "dropout": net_io.dropout,
        }

    def get_connections(self):
        """Get all network connections with process info."""
        conns = []
        try:
            for conn in psutil.net_connections(kind="all"):
                if conn.status == "ESTABLISHED":
                    try:
                        proc_name = ""
                        if conn.pid:
                            proc = psutil.Process(conn.pid)
                            proc_name = proc.name() or ""
                    except (psutil.NoSuchProcess, psutil.ZombieProcess, psutil.AccessDenied):
                        proc_name = ""
                    conns.append({
                        "fd": conn.fd,
                        "family": str(conn.family),
                        "type": str(conn.type),
                        "laddr_ip": conn.laddr.ip if conn.laddr else "",
                        "laddr_port": conn.laddr.port if conn.laddr else 0,
                        "raddr_ip": conn.raddr.ip if conn.raddr else "",
                        "raddr_port": conn.raddr.port if conn.raddr else 0,
                        "status": conn.status,
                        "pid": conn.pid,
                        "process": proc_name,
                    })
        except Exception as e:
            # Permission issue on some platforms
            pass

        # Limit connections to top 100 to prevent overwhelming the UI
        return conns[:100]

    def get_listening_ports(self):
        """Get all listening (open) ports."""
        ports = []
        try:
            for conn in psutil.net_connections(kind="tcp"):
                if conn.status == "LISTEN":
                    try:
                        proc_name = ""
                        if conn.pid:
                            proc = psutil.Process(conn.pid)
                            proc_name = proc.name() or ""
                    except (psutil.NoSuchProcess, psutil.ZombieProcess, psutil.AccessDenied):
                        proc_name = ""
                    ports.append({
                        "port": conn.laddr.port,
                        "ip": conn.laddr.ip,
                        "pid": conn.pid,
                        "process": proc_name,
                    })
        except Exception:
            pass
        ports.sort(key=lambda p: p["port"])
        return ports

    def establish_baseline(self):
        """Capture baseline connections for anomaly detection."""
        self._baseline_connections = set()
        for conn in psutil.net_connections(kind="all"):
            if conn.raddr and conn.raddr.ip:
                self._baseline_connections.add(conn.raddr.ip)
        self._baseline_established = True

    def get_new_connections(self):
        """Detect new remote connections against baseline."""
        new_connections = []
        try:
            current = set()
            for conn in psutil.net_connections(kind="all"):
                if conn.raddr and conn.raddr.ip:
                    current.add(conn.raddr.ip)
                    if self._baseline_established and conn.raddr.ip not in self._baseline_connections:
                        new_connections.append({
                            "ip": conn.raddr.ip,
                            "port": conn.raddr.port,
                            "status": conn.status,
                            "process": conn.pid,
                        })
            self._baseline_connections = current
        except Exception:
            pass
        return new_connections[:20]


collector = NetworkCollector()
