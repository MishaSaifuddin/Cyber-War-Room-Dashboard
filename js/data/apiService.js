/* ============================================
   CYBER WAR ROOM - API Service
   Handles both mock data and real API requests
   ============================================ */

const APIService = {
    mode: 'mock', // 'mock' or 'live'

    init() {
        this.mode = CONFIG.mode;
    },

    setMode(mode) {
        this.mode = mode;
        CONFIG.mode = mode;
    },

    async fetchEndpoint(endpoint) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[API] Error fetching ${endpoint}:`, error.message);
            // Fallback to mock data on error
            return null;
        }
    },

    isLive() {
        return this.mode === 'live';
    },

    async getNetwork() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.networkHealth);
            if (data) return data;
        }
        return MockData.getNetwork();
    },

    async getSecurity() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.securityHealth);
            if (data) return data;
        }
        return MockData.getSecurity();
    },

    async getThreatEvent() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.suspiciousActivities);
            if (data) return data;
        }
        return MockData.getNewThreatEvent();
    },

    async getActivityBreakdown() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.suspiciousActivities + '/breakdown');
            if (data) return data;
        }
        return MockData.getActivityBreakdown();
    },

    async getSystemStatus() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.systemStatus);
            if (data) return data;
        }
        return MockData.getSystemStatus();
    },

    async getIncidents() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.incidents);
            if (data) return data;
        }
        return MockData.getIncidents();
    },

    async getIncidentStats() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.incidents + '/stats');
            if (data) return data;
        }
        return MockData.getIncidentStats();
    },

    async getAssets() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.criticalAssets);
            if (data) return data;
        }
        return MockData.getAssets();
    },

    async getUserActivity() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.userActivities);
            if (data) return data;
        }
        return MockData.getUserActivity();
    },

    async getUserStats() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.userActivities + '/stats');
            if (data) return data;
        }
        return {
            activeSessions: MockData.getActiveSessions(),
            failedLogins: MockData.getFailedLogins(),
            privUsers: MockData.getPrivilegedUsers(),
        };
    },

    async getThreatLevel() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.threatLevels);
            if (data) return data;
        }
        return MockData.getThreatLevel();
    },

    async getThreatCategories() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.threatLevels + '/categories');
            if (data) return data;
        }
        return MockData.getThreatCategories();
    },

    async getReadiness() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.operationalReadiness);
            if (data) return data;
        }
        return MockData.getReadiness();
    },

    async getTeam() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.operationalReadiness + '/team');
            if (data) return data;
        }
        return MockData.getTeam();
    },

    async getCapabilities() {
        if (this.isLive()) {
            const data = await this.fetchEndpoint(CONFIG.api.operationalReadiness + '/capabilities');
            if (data) return data;
        }
        return MockData.getCapabilities();
    },
};

window.APIService = APIService;
