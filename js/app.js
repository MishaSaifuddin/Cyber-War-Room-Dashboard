/* ============================================
   CYBER WAR ROOM - Main Application Entry
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize API service
        APIService.init();

        // Log startup
        console.log('%c🛡️ CYBER WAR ROOM', 'color: #00ff88; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #00ff88');
        console.log('%cSystem initialization started...', 'color: #8892a0;');

        // Initialize DataManager (connects WebSocket)
        DataManager.init();

        const initTime = Date.now();
        const components = [
            { name: 'Header', fn: () => HeaderComponent.init() },
            { name: 'Network Health', fn: () => NetworkHealthComponent.init() },
            { name: 'Security Health', fn: () => SecurityHealthComponent.init() },
            { name: 'Suspicious Activities', fn: () => SuspiciousActivityComponent.init() },
            { name: 'System Status', fn: () => SystemStatusComponent.init() },
            { name: 'Incidents', fn: () => IncidentsComponent.init() },
            { name: 'Critical Assets', fn: () => CriticalAssetsComponent.init() },
            { name: 'User Activities', fn: () => UserActivitiesComponent.init() },
            { name: 'Threat Levels', fn: () => ThreatLevelsComponent.init() },
            { name: 'Operational Readiness', fn: () => OperationalReadinessComponent.init() },
        ];

        components.forEach(({ name, fn }) => {
            try {
                fn();
                console.log(`%c✓ ${name} loaded`, 'color: #00ff88;');
            } catch (err) {
                console.error(`%c✗ ${name} failed to load:`, 'color: #ff3366;', err);
            }
        });

        const elapsed = Date.now() - initTime;
        console.log(`%cSystem ready in ${elapsed}ms ✓`, 'color: #00ff88; font-weight: bold;');

        // Add scan-sweep effect
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.add('scan-sweep-effect');
        });

        // Log connection status
        if (DataManager.isLive()) {
            console.log('%c🎯 CONNECTED TO REAL DETECTION BACKEND', 'color: #00ff88; font-weight: bold;');
        } else {
            console.log('%c⚠️ Backend not detected - running in MOCK mode.', 'color: #ffcc00;');
            console.log('%c   Start the backend:  cd cyber-war-room-dashboard && python backend/main.py', 'color: #8892a0;');
        }

    } catch (error) {
        console.error('%c⚠️ WAR ROOM initialization error:', 'color: #ff3366;', error);
        console.error('Some components may not be fully loaded.');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        // M toggles between AUTO (WebSocket if available) and forced MOCK
        const btn = document.getElementById('modeButton');
        if (btn) {
            // Just update the display status
            HeaderComponent.updateConnectionStatus();
        }
    }
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});

// Handle visibility change to pause/resume when tab not visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('%c[WarRoom] Tab visible, resuming operations...', 'color: #00ff88;');
    } else {
        console.log('%c[WarRoom] Tab hidden, operations continue in background...', 'color: #8892a0;');
    }
});

// Handle window resize for responsive
window.addEventListener('resize', () => {
    // Redraw any charts that depend on canvas sizes
    const netSpark = document.getElementById('netSparkline');
    if (netSpark) {
        NetworkHealthComponent.renderSparkline();
    }
    const threatGauge = document.getElementById('threatGauge');
    if (threatGauge) {
        ThreatLevelsComponent.renderGauge();
    }
});
