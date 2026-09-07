/* ============================================
   CYBER WAR ROOM - User Activities Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const UserActivitiesComponent = {
    _logEl: null,
    _unsubscribe: null,
    _seenEntries: new Set(),

    init() {
        this._logEl = document.getElementById('userLog');

        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.tickMock();
            }
        });

        // Initial render
        this.renderInitialLog();
        this.renderStatsMock();
    },

    updateFromLive(data) {
        if (!data) return;
        const logs = data.logs || {};
        const failedLogins = logs.failed_logins || [];
        const privilegeChanges = logs.privilege_changes || [];

        // Add failed logins to log
        failedLogins.forEach(login => {
            const key = `${login.username || ''}-${login.source_ip || ''}`;
            if (this._seenEntries.has(key)) return;
            this._seenEntries.add(key);

            this.addLogEntry({
                user: login.username || 'unknown',
                action: 'failed',
                message: `failed login from ${login.source_ip || 'unknown'}`,
                time: login.time ? new Date(login.time) : new Date(),
                ip: login.source_ip || '',
            });
        });

        // Add privilege changes
        privilegeChanges.forEach(priv => {
            const key = `priv-${priv.username || ''}`;
            if (this._seenEntries.has(key)) return;
            this._seenEntries.add(key);

            this.addLogEntry({
                user: priv.username || 'unknown',
                action: 'privileged',
                message: 'privilege escalation detected',
                time: priv.time ? new Date(priv.time) : new Date(),
                ip: '',
            });
        });

        // Update stats
        const processes = data.processes || [];
        const activeSessions = processes.length || 0;

        this.updateStats({
            activeSessions,
            failedLogins,
            privUsers: processes.filter(p => {
                const name = (p.name || '').toLowerCase();
                return name.includes('admin') || name.includes('system') || name.includes('svc');
            }).length,
        });
    },

    tickMock() {
        const activity = MockData.getUserActivity();
        this.addLogEntry(activity);
        this.renderStatsMock();
    },

    renderInitialLog() {
        const seedActivities = [
            { user: 'system', action: 'login', message: 'system session started', time: new Date(Date.now() - 30 * 1000), ip: '' },
            { user: 'detection', action: 'login', message: 'detection engine connected', time: new Date(Date.now() - 20 * 1000), ip: '' },
        ];
        seedActivities.forEach(a => this.addLogEntry(a));
    },

    addLogEntry(activity) {
        if (!this._logEl) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const userSpan = document.createElement('span');
        userSpan.className = 'log-user';
        userSpan.textContent = activity.user || 'unknown';

        const actionSpan = document.createElement('span');
        actionSpan.className = `log-action ${this._getActionClass(activity.action)}`;
        actionSpan.textContent = activity.message || '';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = activity.time instanceof Date ? Utils.formatTime(activity.time) : Utils.formatTime(new Date());

        entry.appendChild(userSpan);
        entry.appendChild(actionSpan);
        entry.appendChild(timeSpan);

        this._logEl.insertBefore(entry, this._logEl.firstChild);

        while (this._logEl.children.length > 20) {
            this._logEl.removeChild(this._logEl.lastChild);
        }
    },

    _getActionClass(action) {
        switch (action) {
            case 'failed': return 'failed';
            case 'privileged': return 'privileged';
            case 'login': return 'login';
            case 'logout': return '';
            default: return '';
        }
    },

    renderStatsMock() {
        this.updateStats({
            activeSessions: MockData.getActiveSessions(),
            failedLogins: MockData.getFailedLogins(),
            privUsers: MockData.getPrivilegedUsers(),
        });
    },

    updateStats(stats) {
        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = Number(value).toLocaleString();
        };

        setVal('activeSessions', stats.activeSessions || 0);
        setVal('failedLogins', stats.failedLogins || 0);
        setVal('privUsers', stats.privUsers || 0);

        const failed = document.getElementById('failedLogins');
        const num = Number(stats.failedLogins || 0);
        if (failed) {
            if (num > 20) {
                failed.style.color = '#ff3366';
                failed.style.textShadow = '0 0 10px #ff3366';
            } else if (num > 10) {
                failed.style.color = '#ffcc00';
                failed.style.textShadow = '0 0 10px #ffcc00';
            } else {
                failed.style.color = '';
                failed.style.textShadow = '';
            }
        }

        // User status
        const statusEl = document.getElementById('userStatus');
        if (statusEl) {
            if (num > 20) {
                statusEl.textContent = 'UNDER ATTACK';
                statusEl.className = 'panel-status red';
            } else if (num > 10) {
                statusEl.textContent = 'WATCH';
                statusEl.className = 'panel-status yellow';
            } else {
                statusEl.textContent = 'NORMAL';
                statusEl.className = 'panel-status green';
            }
        }
    }
};

window.UserActivitiesComponent = UserActivitiesComponent;
