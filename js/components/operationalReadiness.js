/* ============================================
   CYBER WAR ROOM - Operational Readiness Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const OperationalReadinessComponent = {
    _unsubscribe: null,

    init() {
        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.tickMock();
            }
        });

        // Initial render
        this.renderReadiness(MockData.getReadiness());
        this.renderTeam(MockData.getTeam());
        this.renderCapabilities(MockData.getCapabilities());
    },

    updateFromLive(data) {
        if (!data) return;

        // Compute readiness from security score / threat level
        const score = data.security_score !== undefined ? data.security_score : 90;
        const anomaliesCount = (data.anomalies || []).length;
        const alertCount = (data.alerts || []).length;

        // Readiness decreases with alerts/anomalies
        let readiness = score;
        readiness -= alertCount * 1.5;
        readiness -= anomaliesCount * 2;

        this.renderReadiness(Math.max(10, Math.min(100, Math.round(readiness))));

        // Team info from logs (if available)
        const logs = data.logs || {};
        const failedLogins = logs.failed_logins || [];
        const team = [
            { name: 'SYSTEM', role: 'MONITOR', status: data.system && data.system.cpu_percent > 80 ? 'yellow' : 'green' },
            { name: 'DETECTION', role: 'ENGINE', status: 'green' },
            { name: 'LOGS', role: 'WINDOWS', status: data.os_available === false ? 'red' : 'green' },
            { name: 'ALERTS', role: `${alertCount} ACTIVE`, status: alertCount > 5 ? 'red' : (alertCount > 2 ? 'yellow' : 'green') },
        ];
        this.renderTeam(team);

        const capabilities = [
            { name: 'CPU MONITORING', value: Math.max(0, 100 - Math.round((data.system?.cpu_percent || 0) / 2)) },
            { name: 'MEMORY MONITORING', value: Math.max(0, 100 - Math.round((data.system?.ram_percent || 0) / 2)) },
            { name: 'NETWORK MONITORING', value: data.network ? 95 : 0 },
            { name: 'FILE MONITORING', value: data.filesystem ? 90 : 0 },
        ];
        this.renderCapabilities(capabilities);
    },

    tickMock() {
        this.renderReadiness(MockData.getReadiness());
        this.renderTeam(MockData.getTeam());
        this.renderCapabilities(MockData.getCapabilities());
    },

    renderReadiness(readiness) {
        const valueEl = document.getElementById('readinessValue');
        if (valueEl) valueEl.textContent = readiness;

        const ring = document.querySelector('.readiness-ring');
        if (ring) {
            const color = readiness > 85 ? 'var(--accent-green)' : readiness > 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';
            ring.style.borderColor = color;
            ring.style.borderTopColor = 'var(--border)';
            ring.style.boxShadow = `0 0 15px ${color}`;
        }

        const statusEl = document.getElementById('readyStatus');
        if (statusEl) {
            if (readiness > 85) {
                statusEl.textContent = 'READY';
                statusEl.className = 'panel-status green';
            } else if (readiness > 70) {
                statusEl.textContent = 'MARGINAL';
                statusEl.className = 'panel-status yellow';
            } else {
                statusEl.textContent = 'NOT READY';
                statusEl.className = 'panel-status red';
            }
        }
    },

    renderTeam(team) {
        const container = document.getElementById('teamStatus');
        if (!container) return;

        const membersDiv = container.querySelector('.team-members');
        if (!membersDiv) return;

        membersDiv.innerHTML = '';

        team.forEach(member => {
            const div = document.createElement('div');
            div.className = 'member';

            const dot = document.createElement('span');
            dot.className = `member-dot ${member.status}`;

            const name = document.createElement('span');
            name.className = 'member-name';
            name.textContent = member.name;

            const role = document.createElement('span');
            role.className = 'member-role';
            role.textContent = member.role;

            div.appendChild(dot);
            div.appendChild(name);
            div.appendChild(role);

            membersDiv.appendChild(div);
        });
    },

    renderCapabilities(capabilities) {
        const container = document.querySelector('.capability-status');
        if (!container) return;

        container.innerHTML = '';

        capabilities.forEach(cap => {
            const row = document.createElement('div');
            row.className = 'cap-row';

            const label = document.createElement('span');
            label.textContent = cap.name;

            const bar = document.createElement('div');
            bar.className = 'cap-bar';

            const fill = document.createElement('div');
            fill.className = 'cap-fill';
            fill.style.width = `${Math.min(100, Math.max(0, cap.value))}%`;
            if (cap.value < 70) fill.style.background = 'linear-gradient(90deg, #ff8800, #ffcc00)';

            bar.appendChild(fill);
            row.appendChild(label);
            row.appendChild(bar);

            container.appendChild(row);
        });
    }
};

window.OperationalReadinessComponent = OperationalReadinessComponent;
