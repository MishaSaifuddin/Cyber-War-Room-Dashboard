/* ============================================
   CYBER WAR ROOM - System Status Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const SystemStatusComponent = {
    _serversEl: null,
    _unsubscribe: null,

    init() {
        this._serversEl = document.getElementById('serverGrid');

        // Subscribe to DataManager
        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.updateFromMock();
            }
        });

        // Initial render
        this.updateFromMock();
    },

    updateFromLive(data) {
        const sys = data.system || {};
        const systemInfo = data.system_info || {};
        const processes = data.processes || [];

        // Create a mock server list representing real system resources
        const servers = [
            {
                name: systemInfo.hostname || 'HOST-PC',
                role: 'MAIN',
                status: sys.cpu_percent > 80 ? 'red' : (sys.cpu_percent > 60 ? 'yellow' : 'green'),
                cpu: Math.round(sys.cpu_percent || 0),
                ram: Math.round(sys.ram_percent || 0),
                disk: Math.round(sys.disk_percent || 0),
                ip: 'localhost',
            },
            {
                name: 'CPU CORES',
                role: `CORES: ${sys.cpu_count || 0}`,
                status: sys.cpu_percent > 80 ? 'red' : (sys.cpu_percent > 60 ? 'yellow' : 'green'),
                cpu: 100,
                ram: 0,
                disk: 0,
                ip: '',
            },
        ];

        // Add top resource-consuming processes as pseudo-servers
        const topProcs = processes.slice(0, 3);
        topProcs.forEach(proc => {
            servers.push({
                name: proc.name || 'Process',
                role: `PID ${proc.pid || '-'}`,
                status: (proc.cpu_percent || 0) > 80 ? 'yellow' : 'green',
                cpu: Math.round(proc.cpu_percent || 0),
                ram: Math.round(proc.memory_percent || 0),
                disk: 0,
                ip: '',
            });
        });

        this.renderServers(servers);
        this.updateStatus(servers);
    },

    updateFromMock() {
        const servers = MockData.getServers();
        this.renderServers(servers);
        this.updateStatus(servers);
    },

    renderServers(servers) {
        if (!this._serversEl) return;
        this._serversEl.innerHTML = '';

        servers.slice(0, 8).forEach(server => {
            const card = this.createServerCard(server);
            this._serversEl.appendChild(card);
        });
    },

    createServerCard(server) {
        const card = document.createElement('div');
        card.className = `server-card ${server.status}`;

        const nameRow = document.createElement('div');
        nameRow.className = 'server-name';
        nameRow.innerHTML = `
            <span title="${server.ip || ''}">${this._truncate(server.name, 18)} <span class="muted">(${server.role || ''})</span></span>
            <span class="server-health-dot ${server.status}"></span>
        `;

        const usageDiv = document.createElement('div');
        usageDiv.className = 'usage-bars';

        const createUsage = (label, value, cls) => {
            const row = document.createElement('div');
            row.className = 'usage-row';
            const span = document.createElement('span');
            span.textContent = label;
            const track = document.createElement('div');
            track.className = 'usage-track';
            const fill = document.createElement('div');
            fill.className = `usage-fill ${cls}${value > 80 ? ' high' : ''}`;
            fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
            track.appendChild(fill);
            row.appendChild(span);
            row.appendChild(track);
            return row;
        };

        usageDiv.appendChild(createUsage('CPU', server.cpu, 'cpu-fill'));
        usageDiv.appendChild(createUsage('RAM', server.ram, 'ram-fill'));
        usageDiv.appendChild(createUsage('DSK', server.disk, 'disk-fill'));

        card.appendChild(nameRow);
        card.appendChild(usageDiv);

        return card;
    },

    updateStatus(servers) {
        const statusEl = document.getElementById('sysStatus');
        if (!statusEl) return;

        const criticalCount = servers.filter(s => s.status === 'red').length;
        const warningCount = servers.filter(s => s.status === 'yellow').length;

        if (criticalCount > 0) {
            statusEl.textContent = `${criticalCount} SYSTEM(S) CRITICAL`;
            statusEl.className = 'panel-status red';
        } else if (warningCount > 0) {
            statusEl.textContent = `${warningCount} SYSTEM(S) DEGRADED`;
            statusEl.className = 'panel-status yellow';
        } else {
            statusEl.textContent = 'ALL SYSTEMS GO';
            statusEl.className = 'panel-status green';
        }
    },

    _truncate(str, max) {
        if (!str) return '';
        return str.length > max ? str.substring(0, max - 3) + '...' : str;
    }
};

window.SystemStatusComponent = SystemStatusComponent;
