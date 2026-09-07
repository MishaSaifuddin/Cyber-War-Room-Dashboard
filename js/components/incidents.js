/* ============================================
   CYBER WAR ROOM - Incidents Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const IncidentsComponent = {
    _listEl: null,
    _unsubscribe: null,

    init() {
        this._listEl = document.getElementById('incidentList');

        // Subscribe to DataManager
        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.tickMock();
            }
        });

        // Initial render
        this.renderStatsMock();
        this.renderIncidentsMock();
    },

    updateFromLive(data) {
        if (!data) return;
        const alerts = data.alerts || [];
        const anomalies = data.anomalies || [];

        // Convert alerts + anomalies to incidents
        const incidents = [];

        alerts.forEach(alert => {
            incidents.push({
                id: alert.id || `LIVE-${Math.random().toString(16).slice(2, 8)}`,
                title: alert.rule || 'SECURITY ALERT',
                description: alert.message || 'Alert',
                severity: this._mapSeverity(alert.severity),
                time: new Date(alert.time * 1000),
                status: 'ACTIVE',
                assignee: 'DETECTION ENGINE',
                live: true,
            });
        });

        anomalies.forEach(anomaly => {
            incidents.push({
                id: `ANOM-${Math.random().toString(16).slice(2, 6)}`,
                title: anomaly.type || 'ANOMALY',
                description: anomaly.detail || 'Statistical deviation detected',
                severity: this._mapSeverity(anomaly.severity || 'MEDIUM'),
                time: new Date(anomaly.time * 1000),
                status: 'ACTIVE',
                assignee: 'ENGINE',
                live: true,
            });
        });

        // Sort by time (most recent first)
        incidents.sort((a, b) => b.time - a.time);

        // Update stats
        const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
        const high = incidents.filter(i => i.severity === 'HIGH').length;
        const medium = incidents.filter(i => i.severity === 'MEDIUM').length;

        this.updateStats({
            critical,
            high,
            medium,
            low: Math.max(0, incidents.length - critical - high - medium),
            total: incidents.length,
            avgResponse: 'LIVE',
        });

        this.renderIncidentsList(incidents.slice(0, 5));

        // Update count badge
        const countEl = document.getElementById('incidentCount');
        if (countEl) {
            countEl.textContent = `${incidents.length} ACTIVE`;
            countEl.className = `panel-status ${critical > 0 ? 'red' : 'yellow'}`;
        }
    },

    tickMock() {
        MockData.modifyIncidents();
        this.renderStatsMock();
        this.renderIncidentsMock();
    },

    renderStatsMock() {
        const stats = MockData.getIncidentStats();

        this.updateStats(stats);

        const countEl = document.getElementById('incidentCount');
        if (countEl) {
            countEl.textContent = `${stats.total} ACTIVE`;
            countEl.className = `panel-status ${stats.critical > 0 ? 'red' : 'yellow'}`;
        }
    },

    updateStats(stats) {
        const setVal = (id, value, color) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                el.style.color = color || '';
            }
        };

        setVal('incCritical', stats.critical, '#ff3366');
        setVal('incHigh', stats.high, '#ff8800');
        setVal('incMedium', stats.medium, '#ffcc00');
        setVal('avgResponse', stats.avgResponse);
    },

    renderIncidentsMock() {
        const incidents = MockData.getIncidents().slice(0, 5);
        this.renderIncidentsList(incidents);
    },

    renderIncidentsList(incidents) {
        if (!this._listEl) return;
        this._listEl.innerHTML = '';

        incidents.forEach(incident => {
            const item = document.createElement('div');
            item.className = `incident-item ${incident.severity.toLowerCase()}`;

            const title = document.createElement('span');
            title.className = 'incident-title';
            title.textContent = incident.title;
            title.title = incident.description || '';

            const time = document.createElement('span');
            time.className = 'incident-time';
            time.textContent = Utils.formatDateTime(incident.time);

            const sev = document.createElement('span');
            sev.className = 'incident-severity';
            sev.textContent = incident.severity;

            const severityColors = {
                CRITICAL: '#ff3366',
                HIGH: '#ff8800',
                MEDIUM: '#ffcc00',
                LOW: '#00aaff'
            };
            sev.style.color = severityColors[incident.severity] || '#00aaff';

            item.appendChild(title);
            if (incident.severity === 'CRITICAL') {
                item.classList.add('critical-incident');
            }
            item.appendChild(time);
            item.appendChild(sev);

            this._listEl.appendChild(item);
        });
    },

    _mapSeverity(sev) {
        const sevStr = String(sev).toUpperCase();
        if (sevStr.includes('CRIT')) return 'CRITICAL';
        if (sevStr.includes('HIGH')) return 'HIGH';
        if (sevStr.includes('MED')) return 'MEDIUM';
        return 'LOW';
    }
};

window.IncidentsComponent = IncidentsComponent;
