/* ============================================
   CYBER WAR ROOM - Configuration
   ============================================ */

const CONFIG = {
    // Data mode: 'mock' or 'live'
    mode: 'mock',

    // WebSocket connection settings
    ws: {
        endpoint: 'ws://127.0.0.1:8765',
        maxReconnectAttempts: 10,
        reconnectDelay: 3000,
    },

    // API endpoints (used in live mode)
    api: {
        networkHealth: '/api/network-health',
        securityHealth: '/api/security-health',
        suspiciousActivities: '/api/suspicious-activities',
        systemStatus: '/api/system-status',
        incidents: '/api/incidents',
        criticalAssets: '/api/critical-assets',
        userActivities: '/api/user-activities',
        threatLevels: '/api/threat-levels',
        operationalReadiness: '/api/operational-readiness',
    },

    // Update intervals (in milliseconds)
    intervals: {
        headerClock: 1000,
        network: 2000,
        security: 3000,
        threatFeed: 2500,
        attackMap: 5000,
        systemStatus: 5000,
        incidents: 10000,
        assets: 15000,
        userActivities: 5000,
        threatLevels: 5000,
        readiness: 10000,
        lastUpdate: 1000,
    },

    alerts: {
        maxActive: 5,
        autoDismiss: 30000, // ms
        sounds: {
            enabled: false,
            path: '/assets/audio/alert.mp3'
        }
    },

    threat: {
        levels: {
            1: { label: 'DEFCON 1', color: '#ff3366', glow: '0 0 10px #ff3366' },
            2: { label: 'DEFCON 2', color: '#ff8800', glow: '0 0 10px #ff8800' },
            3: { label: 'DEFCON 3', color: '#ffcc00', glow: '0 0 10px #ffcc00' },
            4: { label: 'DEFCON 4', color: '#00aaff', glow: '0 0 10px #00aaff' },
            5: { label: 'DEFCON 5', color: '#00ff88', glow: '0 0 10px #00ff88' }
        }
    }
};

window.CONFIG = CONFIG;
