/* ============================================
   CYBER WAR ROOM - Threat Levels Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const ThreatLevelsComponent = {
    _trendData: [],
    _currentLevel: 60,
    _unsubscribe: null,

    init() {
        this._trendData = MockData.getThreatTrend();

        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.tickMock();
            }
        });

        // Initial render
        this._currentLevel = MockData.getThreatLevel();
        this.renderGauge();
        this.renderTrend();
        this.updateStatus();
    },

    updateFromLive(data) {
        if (!data) return;
        const threat = data.threat_level !== undefined ? data.threat_level : (data.threatLevel || 50);
        this._currentLevel = threat;
        this.renderGauge();
        this.updateStatus();

        // Build threat categories from alerts
        const alerts = data.alerts || [];
        const categories = this._buildCategoriesFromAlerts(alerts);

        this.renderCategoriesData(categories);

        // Update trend
        this._trendData.push(threat);
        if (this._trendData.length > 24) this._trendData.shift();
        this.renderTrend();
    },

    tickMock() {
        this._currentLevel = MockData.getThreatLevel();
        this.renderGauge();
        this.updateStatus();

        const categories = MockData.getThreatCategories();
        this.renderCategoriesData(categories);

        this._trendData = MockData.updateThreatTrend();
        this.renderTrend();
    },

    _buildCategoriesFromAlerts(alerts) {
        const cats = {
            'MALWARE': '#aa66ff',
            'SCANNING': '#ffcc00',
            'AUTH': '#ff8800',
            'SYSTEM': '#ff3366',
            'FILE': '#00aaff',
            'NETWORK': '#ffcc00',
        };

        const counts = {};
        alerts.forEach(alert => {
            const rule = alert.rule || '';
            let key = 'NETWORK';
            if (rule.includes('PROCESS') || rule.includes('MALWARE')) key = 'MALWARE';
            else if (rule.includes('PORT') || rule.includes('CONNECTION')) key = 'SCANNING';
            else if (rule.includes('LOGIN')) key = 'AUTH';
            else if (rule.includes('CPU') || rule.includes('RAM')) key = 'SYSTEM';
            else if (rule.includes('FILE')) key = 'FILE';
            counts[key] = (counts[key] || 0) + 1;
        });

        const categories = Object.entries(counts).map(([name, value]) => ({
            name,
            color: cats[name] || '#8892a0',
            value: Math.min(100, value * 15),
        }));

        if (categories.length === 0) {
            return [
                { name: 'SYSTEM', color: '#ff3366', value: 10 },
                { name: 'AUTH', color: '#ff8800', value: 15 },
                { name: 'MONITORING', color: '#00aaff', value: 20 },
            ];
        }

        return categories;
    },

    renderGauge() {
        const canvas = document.getElementById('threatGauge');
        if (!canvas) return;

        const color = this._currentLevel > 75 ? '#ff3366' :
                      this._currentLevel > 55 ? '#ff8800' :
                      this._currentLevel > 35 ? '#ffcc00' : '#00ff88';

        Charts.drawGauge(canvas, this._currentLevel, 100, color, color, 'THREAT LEVEL');

        const valueEl = document.getElementById('threatGaugeValue');
        if (valueEl) {
            valueEl.textContent = this._currentLevel;
            valueEl.style.color = color;
            valueEl.style.textShadow = `0 0 10px ${color}`;
        }

        // Update header defcon
        HeaderComponent.updateThreatLevel(this._currentLevel);
    },

    renderCategoriesData(categories) {
        const container = document.getElementById('threatCategories');
        if (!container) return;
        container.innerHTML = '';

        categories.slice(0, 6).forEach(cat => {
            const row = document.createElement('div');
            row.className = 'threat-cat';

            const dot = document.createElement('span');
            dot.className = 'threat-cat-dot';
            dot.style.background = cat.color || '#00aaff';
            dot.style.boxShadow = `0 0 5px ${cat.color || '#00aaff'}`;

            const name = document.createElement('span');
            name.className = 'threat-cat-name';
            name.textContent = cat.name;

            const value = document.createElement('span');
            value.className = 'threat-cat-value';
            value.textContent = cat.value || 0;
            value.style.color = (cat.value || 0) > 70 ? '#ff3366' : (cat.value || 0) > 40 ? '#ffcc00' : '#00ff88';

            row.appendChild(dot);
            row.appendChild(name);
            row.appendChild(value);

            container.appendChild(row);
        });
    },

    renderTrend() {
        const canvas = document.getElementById('threatTrend');
        if (!canvas || this._trendData.length < 2) return;
        Charts.drawLineGraph(canvas, this._trendData, '#ff8800', true);
    },

    updateStatus() {
        const statusEl = document.getElementById('threatStatus');
        if (!statusEl) return;

        if (this._currentLevel > 75) {
            statusEl.textContent = 'SEVERE';
            statusEl.className = 'panel-status red';
        } else if (this._currentLevel > 55) {
            statusEl.textContent = 'ELEVATED';
            statusEl.className = 'panel-status yellow';
        } else {
            statusEl.textContent = 'NORMAL';
            statusEl.className = 'panel-status green';
        }
    }
};

window.ThreatLevelsComponent = ThreatLevelsComponent;
