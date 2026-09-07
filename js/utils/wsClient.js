/* ============================================
   CYBER WAR ROOM - WebSocket Client
   Connects to the Python detection backend
   ============================================ */

const WSClient = {
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    reconnectDelay: 3000,
    callbacks: new Set(),
    lastData: null,

    // Default WebSocket endpoint
    endpoint: 'ws://127.0.0.1:8765',

    init() {
        this.connect();
    },

    connect() {
        try {
            console.log('[WS] Connecting to detection backend...');
            this.socket = new WebSocket(this.endpoint);

            this.socket.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('%c[WS] Connected to detection backend', 'color: #00ff88;');
                this.notifyListeners('connected');
            };

            this.socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'snapshot' || msg.type === 'update') {
                        this.lastData = msg.data;
                        this.notifyListeners('data', msg.data);
                    }
                } catch (e) {
                    console.error('[WS] Failed to parse message:', e);
                }
            };

            this.socket.onclose = () => {
                this.connected = false;
                console.warn('[WS] Disconnected from detection backend');
                this.notifyListeners('disconnected');
                this.attemptReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('[WS] WebSocket error:', error);
            };
        } catch (e) {
            console.error('[WS] Connection error:', e);
            this.attemptReconnect();
        }
    },

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WS] Max reconnect attempts reached. Is the backend running?');
            this.notifyListeners('fallback_mock');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[WS] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay / 1000}s...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
    },

    subscribe(callback) {
        this.callbacks.add(callback);
        if (this.lastData) {
            callback('data', this.lastData);
        }
        return () => this.callbacks.delete(callback);
    },

    notifyListeners(type, data) {
        this.callbacks.forEach(cb => {
            try {
                cb(type, data);
            } catch (e) {
                console.error('[WS] Listener error:', e);
            }
        });
    },

    isConnected() {
        return this.connected;
    },

    getLastData() {
        return this.lastData;
    },

    // Send data back to the server (for control commands)
    send(data) {
        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify(data));
        }
    },

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
};

window.WSClient = WSClient;
