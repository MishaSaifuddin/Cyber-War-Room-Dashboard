/* ============================================
   CYBER WAR ROOM - Suspicious Activities Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const SuspiciousActivityComponent = {
    _feedEl: null,
    _unsubscribe: null,

    init() {
        this._feedEl = document.getElementById('threatFeed');

        // Seed mock feed
        for (let i = 0; i < 5; i++) {
            const event = MockData.getNewThreatEvent();
            MockData.pushThreatEvent(event);
        }
        this.renderFeed();

        // Subscribe to DataManager
        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.tickMock();
            }
        });

        this.renderBreakdownMock();
    },

    updateFromLive(data) {
        if (!data) return;

        // Feed items from alerts
        const alerts = data.alerts || [];
        const anomalies = data.anomalies || [];
        const allEvents = [];

        // Map alerts to feed items
        alerts.forEach(alert => {
            allEvents.push({
                time: new Date(alert.time * 1000),
                type: this._alertToType(alert.rule),
                severity: alert.severity,
                severityColor: this._severityToColor(alert.severity),
                description: alert.message,
            });
        });

        // Map anomalies to feed items
        anomalies.forEach(anomaly => {
            allEvents.push({
                time: new Date(anomaly.time * 1000),
                type: 'ANOMALY',
                severity: anomaly.severity || 'MEDIUM',
                severityColor: anomaly.severity === 'HIGH' ? '#ff8800' : '#ffcc00',
                description: anomaly.detail || 'Anomalous behaviour detected',
            });
        });

        // Add user activities as feed items
        const logs = data.logs || {};
        const failedLogins = logs.failed_logins || [];
        failedLogins.forEach(login => {
            allEvents.push({
                time: new Date(login.time || Date.now()),
                type: 'BRUTE',
                severity: 'HIGH',
                severityColor: '#ff8800',
                description: `Failed login for ${login.username || 'unknown'} from ${login.source_ip || 'unknown'}`,
            });
        });

        // Render latest events
        if (allEvents.length > 0) {
            this.displayEvents(allEvents);
        }

        // Update activity breakdown
        this.renderBreakdownLive(allEvents);
        this.updateStatus(allEvents);
    },

    tickMock() {
        const event = MockData.getNewThreatEvent();
        MockData.pushThreatEvent(event);
        this.addFeedItem(event);
        this.updateStatus(MockData.getThreatFeed());
        this.renderBreakdownMock();
    },

    displayEvents(events) {
        // Sort by time desc and get most recent
        const sorted = [...events].sort((a, b) => b.time - a.time).slice(0, 10);
        if (!this._feedEl) return;

        // Only add items we haven't seen
        const existingTexts = new Set();
        this._feedEl.querySelectorAll('.feed-description').forEach(el => existingTexts.add(el.textContent));

        sorted.forEach(event => {
            if (!existingTexts.has(event.description)) {
                this.addFeedItem(event);
            }
        });
    },

    addFeedItem(event) {
        if (!this._feedEl) return;

        while (this._feedEl.children.length >= 10) {
            this._feedEl.removeChild(this._feedEl.lastChild);
        }

        const item = document.createElement('div');
        item.className = 'feed-item feed-item-new';

        const time = document.createElement('span');
        time.className = 'feed-time';
        time.textContent = event.time instanceof Date ? Utils.formatTime(event.time) : 'NOW';

        const type = document.createElement('span');
        type.className = `feed-type ${this._getFeedTypeClass(event.type)}`;
        type.textContent = event.type;

        const desc = document.createElement('span');
        desc.className = 'feed-description';
        desc.textContent = event.description || 'Alert';

        const sev = document.createElement('span');
        sev.className = 'feed-severity';
        sev.textContent = event.severity || 'LOW';
        sev.style.color = event.severityColor || '#00aaff';
        sev.style.textShadow = `0 0 5px ${event.severityColor || '#00aaff'}`;

        item.appendChild(time);
        item.appendChild(type);
        item.appendChild(desc);
        item.appendChild(sev);

        this._feedEl.insertBefore(item, this._feedEl.firstChild);

        if (event.severity === 'CRITICAL') {
            item.style.background = 'var(--accent-red-dim)';
        }
    },

    renderFeed() {
        if (!this._feedEl) return;
        this._feedEl.innerHTML = '';
        const items = MockData.getThreatFeed().slice(0, 10);
        items.forEach(event => this.addFeedItem(event));
    },

    renderBreakdownMock() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;
        const data = MockData.getActivityBreakdown();
        Charts.drawDonut(canvas, data);
    },

    renderBreakdownLive(events) {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        // Count events by type
        const typeCounts = {};
        events.forEach(e => {
            const t = e.type || 'OTHER';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });

        const colors = {
            'BRUTE': '#ff3366',
            'SCAN': '#ffcc00',
            'MALWARE': '#aa66ff',
            'PHISH': '#00aaff',
            'DDOS': '#ff8800',
            'ANOMALY': '#00aaff',
            'HIGH_CPU': '#ff3366',
            'HIGH_RAM': '#ff8800',
            'SUSPICIOUS_PROCESS': '#aa66ff',
            'SUSPICIOUS_PORT': '#ff8800',
            'FAILED_LOGINS': '#ffcc00',
            'FILE_INTEGRITY': '#ff8800',
            'SUSPICIOUS_FILE': '#ff3366',
            'NEW_CONNECTION': '#00aaff',
            'NEW_PROCESS': '#ffcc00',
            'OTHER': '#8892a0',
        };

        const data = Object.entries(typeCounts).map(([type, count]) => ({
            label: type,
            value: count,
            color: colors[type] || '#8892a0',
        }));

        if (data.length > 0) {
            Charts.drawDonut(canvas, data);
        } else {
            this.renderBreakdownMock();
        }
    },

    updateStatus(events) {
        const statusEl = document.getElementById('susStatus');
        if (!statusEl) return;

        let criticalCount = 0;
        if (Array.isArray(events)) {
            criticalCount = events.filter(e => e.severity === 'CRITICAL').length;
        }

        if (criticalCount > 0) {
            statusEl.textContent = 'THREATS DETECTED';
            statusEl.className = 'panel-status red';
        } else if (events.length > 5) {
            statusEl.textContent = 'ELEVATED ACTIVITY';
            statusEl.className = 'panel-status yellow';
        } else {
            statusEl.textContent = 'MONITORING';
            statusEl.className = 'panel-status green';
        }

        // Update global alert count
        HeaderComponent.updateAlertCount(criticalCount);
    },

    _alertToType(rule) {
        const mapping = {
            'HIGH_CPU': 'ANOMALY',
            'CPU_ANOMALY': 'ANOMALY',
            'HIGH_RAM': 'ANOMALY',
            'SUSPICIOUS_PROCESS': 'MALWARE',
            'HIGH_PROCESS_CPU': 'ANOMALY',
            'NEW_PROCESS': 'SCAN',
            'SUSPICIOUS_PORT': 'SCAN',
            'FAILED_LOGINS': 'BRUTE',
            'FILE_INTEGRITY': 'ANOMALY',
            'SUSPICIOUS_FILE': 'MALWARE',
            'NEW_CONNECTION': 'ANOMALY',
        };
        return mapping[rule] || 'ANOMALY';
    },

    _severityToColor(severity) {
        const colors = {
            'CRITICAL': '#ff3366',
            'HIGH': '#ff8800',
            'MEDIUM': '#ffcc00',
            'LOW': '#00aaff',
        };
        return colors[severity] || '#00aaff';
    },

    _getFeedTypeClass(type) {
        const map = {
            'BRUTE': 'BRUTE', 'SCAN': 'SCAN', 'MALWARE': 'MALWARE',
            'PHISH': 'PHISH', 'DDOS': 'DDOS', 'ANOMALY': 'ANOMALY',
        };
        return map[type] || 'ANOMALY';
    }
};

window.SuspiciousActivityComponent = SuspiciousActivityComponent;
