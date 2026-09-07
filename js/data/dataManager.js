/* ============================================
   CYBER WAR ROOM - Data Manager
   Bridges between WebSocket (real data) and Mock mode
   Components subscribe to get data updates
   ============================================ */

const DataManager = {
    _subscribers: new Set(),
    _mode: 'auto', // 'auto' | 'mock' | 'live'
    _lastLiveData: null,

    init() {
        // Initialize WebSocket client
        WSClient.endpoint = CONFIG.ws.endpoint;
        WSClient.init();

        // Subscribe to WebSocket updates
        WSClient.subscribe((type, data) => {
            if (type === 'data') {
                this._lastLiveData = data;
                this._notify('update', data);
            } else if (type === 'connected') {
                this._notify('connection', { status: 'connected' });
                HeaderComponent.updateConnectionStatus('LIVE');
            } else if (type === 'disconnected') {
                this._notify('connection', { status: 'disconnected' });
                HeaderComponent.updateConnectionStatus('MOCK');
            } else if (type === 'fallback_mock') {
                console.warn('[DataManager] Falling back to mock data');
                this._notify('connection', { status: 'mock_fallback' });
                HeaderComponent.updateConnectionStatus('MOCK');
            }
        });

        // Mock mode ticker
        setInterval(() => {
            if (!this.shouldUseLive()) {
                this._notify('mock_tick', null);
            }
        }, 2000);
    },

    /**
     * Subscribe to data updates
     * callback(type, data):
     *   - type: 'update' (live data snapshot), 'mock_tick' (mock timer), 'connection'
     */
    subscribe(callback) {
        this._subscribers.add(callback);
        // Send initial data if available
        if (this._lastLiveData) {
            callback('update', this._lastLiveData);
        }
        return () => this._subscribers.delete(callback);
    },

    _notify(type, data) {
        this._subscribers.forEach(cb => {
            try {
                cb(type, data);
            } catch (e) {
                console.error('[DataManager] Subscriber error:', e);
            }
        });
    },

    shouldUseLive() {
        return WSClient.isConnected();
    },

    isLive() {
        return this.shouldUseLive();
    },

    isBackendAvailable() {
        return this._lastLiveData !== null;
    },

    getSnapshot() {
        return this._lastLiveData;
    },
};

window.DataManager = DataManager;
