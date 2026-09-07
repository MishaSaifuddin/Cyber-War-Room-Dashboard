/* ============================================
   CYBER WAR ROOM - Header Component
   Clock, Threat Level, Alerts, Mode Toggle
   ============================================ */

const HeaderComponent = {
    _clockInterval: null,

    init() {
        this.updateClock();
        this.updateThreatLevel(MockData.getThreatLevel());
        this.updateConnectionStatus();
        this.attachListeners();

        // Update clock every second
        this._clockInterval = setInterval(() => this.updateClock(), CONFIG.intervals.headerClock);
    },

    updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('utcClock');
        if (clockEl) {
            clockEl.textContent = Utils.formatTime(now);
        }

        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = `LAST UPDATE: ${Utils.formatTime(now)}`;
        }
    },

    updateThreatLevel(score) {
        const threatValue = document.getElementById('threatLevelValue');
        if (!threatValue) return;

        // DEFCON mapping based on score (higher score = higher threat)
        let defcon, color;
        if (score > 80) { defcon = 'DEFCON 1'; color = '#ff3366'; }
        else if (score > 65) { defcon = 'DEFCON 2'; color = '#ff8800'; }
        else if (score > 45) { defcon = 'DEFCON 3'; color = '#ffcc00'; }
        else if (score > 25) { defcon = 'DEFCON 4'; color = '#00aaff'; }
        else { defcon = 'DEFCON 5'; color = '#00ff88'; }

        if (threatValue.textContent !== defcon) {
            threatValue.textContent = defcon;
            threatValue.style.color = color;
            threatValue.style.textShadow = `0 0 10px ${color}`;
            threatValue.classList.add('threat-level-changed');
            setTimeout(() => threatValue.classList.remove('threat-level-changed'), 1000);
        }

        // Update DEFCON indicator background
        const indicator = document.getElementById('defconIndicator');
        if (indicator) {
            indicator.style.borderColor = color;
            indicator.style.boxShadow = `0 0 10px ${color}22`;
        }
    },

    updateFromLiveData(data) {
        if (!data) return;

        // Update threat level from live data
        if (data.threat_level !== undefined) {
            this.updateThreatLevel(data.threat_level);
        } else if (data.threatLevel !== undefined) {
            this.updateThreatLevel(data.threatLevel);
        }

        // Update alerts from live data
        const alerts = data.alerts || data.active_alerts || [];
        if (Array.isArray(alerts)) {
            this.updateAlertCount(alerts.length);
        }
    },

    updateAlertCount(count) {
        const alertCount = document.getElementById('alertCount');
        if (!alertCount) return;
        alertCount.textContent = count;

        const badge = document.getElementById('alertBadge');
        if (badge) {
            if (count > 0) {
                badge.classList.add('alerts-active');
                badge.style.borderColor = '#ff3366';
            } else {
                badge.classList.remove('alerts-active');
                badge.style.borderColor = '';
            }
        }
    },

    updateConnectionStatus(mode) {
        const connLabel = document.getElementById('connectionLabel');
        if (!connLabel) return;

        // If mode param provided, override. Otherwise check DataManager
        let displayMode = mode;
        if (displayMode === undefined) {
            displayMode = DataManager && DataManager.isLive() ? 'LIVE' : 'MOCK';
        }
        connLabel.textContent = displayMode;

        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            const isLive = displayMode === 'LIVE';
            statusEl.querySelector('.status-dot').style.background =
                isLive ? '#00ff88' : '#00aaff';
            statusEl.querySelector('.status-dot').style.boxShadow =
                isLive ? '0 0 10px #00ff88' : '0 0 10px #00aaff';
            if (isLive) {
                statusEl.querySelector('.status-dot').style.animation =
                    'dot-pulse 1.5s ease-in-out infinite';
            }
        }

        const footerMode = document.getElementById('footerMode');
        if (footerMode) {
            footerMode.textContent = displayMode;
        }
    },

    attachListeners() {
        const modeButton = document.getElementById('modeButton');
        if (modeButton) {
            modeButton.addEventListener('click', () => {
                // Just refresh connection status
                this.updateConnectionStatus();
                console.log('%c[WarRoom] Connection status refreshed. Backend detected: ' + (DataManager.isLive() ? 'YES' : 'NO'), 'color: #00ff88;');
            });
        }
    }
};

window.HeaderComponent = HeaderComponent;
