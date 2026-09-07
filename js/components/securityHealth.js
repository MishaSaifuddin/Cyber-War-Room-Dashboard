/* ============================================
   CYBER WAR ROOM - Security Health Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const SecurityHealthComponent = {
    _lastScore: 0,
    _unsubscribe: null,

    async init() {
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
        if (!data) return;

        const score = data.security_score !== undefined ? data.security_score : (data.securityScore || 90);
        const alerts = data.alerts || [];

        // Calculate vulnerability counts based on alerts
        const criticalVulns = alerts.filter(a => a.severity === 'CRITICAL').length;
        const highVulns = alerts.filter(a => a.severity === 'HIGH').length;
        const mediumVulns = alerts.filter(a => a.severity === 'MEDIUM').length;
        const lowVulns = Math.max(0, alerts.length - criticalVulns - highVulns - mediumVulns);

        const sys = data.system || {};
        const patchCompliance = Math.max(60, Math.min(100, 100 - Math.floor(sys.cpu_percent / 5)));

        this.update({
            score,
            criticalVulns,
            highVulns,
            mediumVulns,
            lowVulns,
            patchCompliance,
        });
    },

    updateFromMock() {
        const mock = MockData.getSecurity();
        this.update(mock);
    },

    update(data) {
        if (!data) return;

        // Score gauge
        const gauge = document.getElementById('securityGauge');
        if (gauge) {
            const colors = data.score > 80 ? '#00ff88' : data.score > 60 ? '#ffcc00' : '#ff3366';
            Charts.drawGauge(gauge, data.score, 100, colors, colors, 'SECURITY SCORE');
        }

        const scoreEl = document.getElementById('securityScore');
        if (scoreEl) {
            const current = parseInt(scoreEl.textContent) || 0;
            if (current !== data.score) {
                scoreEl.textContent = data.score;
                if (data.score < current) {
                    scoreEl.style.color = '#ff3366';
                    scoreEl.style.textShadow = '0 0 10px #ff3366';
                } else {
                    scoreEl.style.color = '#00ff88';
                    scoreEl.style.textShadow = '0 0 10px #00ff88';
                }
                setTimeout(() => {
                    scoreEl.style.color = data.score > 80 ? '#00ff88' : data.score > 60 ? '#ffcc00' : '#ff3366';
                    scoreEl.style.textShadow = data.score > 80 ? '0 0 10px #00ff88' : data.score > 60 ? '0 0 10px #ffcc00' : '0 0 10px #ff3366';
                }, 1500);
            }
        }

        // Vulnerability counts
        const setCount = (id, value, color) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                el.style.color = color;
            }
        };

        setCount('vulnCritical', data.criticalVulns, '#ff3366');
        setCount('vulnHigh', data.highVulns, '#ff8800');
        setCount('vulnMedium', data.mediumVulns, '#ffcc00');
        setCount('vulnLow', data.lowVulns || 0, '#00aaff');

        // Patch compliance
        const patchEl = document.getElementById('patchCompliance');
        if (patchEl) {
            patchEl.textContent = `${data.patchCompliance}%`;
        }
        const patchBar = document.getElementById('patchBar');
        if (patchBar) {
            patchBar.style.width = `${data.patchCompliance}%`;
        }

        // Last scan time
        const lastScanEl = document.getElementById('lastScan');
        if (lastScanEl) {
            lastScanEl.textContent = 'LIVE';
        }

        // Status
        const statusEl = document.getElementById('secStatus');
        if (statusEl) {
            let status = 'SECURED';
            let className = 'green';
            if (data.score < 50) { status = 'COMPROMISED'; className = 'red'; }
            else if (data.score < 70) { status = 'AT RISK'; className = 'yellow'; }
            statusEl.textContent = status;
            statusEl.className = `panel-status ${className}`;
        }
    }
};

window.SecurityHealthComponent = SecurityHealthComponent;
