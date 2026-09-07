/* ============================================
   CYBER WAR ROOM - Network Health Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const NetworkHealthComponent = {
    _lastData: null,
    _sparklineData: [],
    _unsubscribe: null,

    async init() {
        this._sparklineData = Array.from({ length: 30 }, () => Utils.randomBetween(0, 100));

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
        this.renderSparkline();
    },

    updateFromLive(data) {
        if (!data || !data.network) return;

        const net = data.network;
        const formatted = {
            uptime: net.uptime_percent !== undefined ? net.uptime_percent : 99.97,
            latency: net.latency_ms !== undefined ? net.latency_ms : this._randomLatency(),
            inTraffic: net.in_rate !== undefined ? Utils.formatBandwidth(net.in_rate / 1000000) : Utils.formatBandwidth(Utils.randomFloat(0.5, 2.5)),
            outTraffic: net.out_rate !== undefined ? Utils.formatBandwidth(net.out_rate / 1000000) : Utils.formatBandwidth(Utils.randomFloat(0.3, 1.5)),
            connections: net.total_connections !== undefined ? net.total_connections : this._randomConnections(),
            packetLoss: this._randomPacketLoss(),
            status: this._getNetStatus(net),
        };

        this.update(formatted);
        this.updateSparklineData(formatted);
    },

    updateFromMock() {
        const mock = MockData.getNetwork();
        this.update(mock);
        this.updateSparklineData(mock);
    },

    update(data) {
        if (!data) return;

        const setVal = (id, value, previous) => {
            const el = document.getElementById(id);
            if (el && el.textContent !== value) {
                el.textContent = value;
                if (previous !== undefined && value !== previous) {
                    el.classList.remove('tick-up');
                    void el.offsetWidth;
                    el.classList.add('tick-up');
                }
            }
        };

        setVal('uptime', `${data.uptime}%`);
        setVal('latency', `${data.latency}ms`);
        setVal('inTraffic', data.inTraffic);
        setVal('outTraffic', data.outTraffic);
        setVal('connections', typeof data.connections === 'number' ? data.connections.toLocaleString() : data.connections);
        setVal('packetLoss', `${data.packetLoss}%`);

        // Status indicator
        const statusEl = document.getElementById('netStatus');
        if (statusEl) {
            statusEl.textContent = data.status;
            statusEl.className = 'panel-status';
            if (data.status === 'OPERATIONAL') statusEl.classList.add('green');
            else if (data.status === 'WARNING' || data.status === 'DEGRADED') statusEl.classList.add('yellow');
            else statusEl.classList.add('red');
        }

        // Traffic bars
        const inPct = Utils.clamp((data.inTraffic / 2.5) * 100, 10, 100);
        const outPct = Utils.clamp((data.outTraffic / 2.0) * 100, 10, 100);

        const barIn = document.getElementById('barIn');
        const barOut = document.getElementById('barOut');
        if (barIn) barIn.style.width = `${inPct}%`;
        if (barOut) barOut.style.width = `${outPct}%`;

        this._lastData = data;
    },

    updateSparklineData(data) {
        const val = typeof data.connections === 'number'
            ? Math.min(100, (data.connections % 100))
            : Utils.randomBetween(30, 95);
        this._sparklineData.push(val);
        if (this._sparklineData.length > 30) this._sparklineData.shift();
        this.renderSparkline();
    },

    renderSparkline() {
        const canvas = document.getElementById('netSparkline');
        if (!canvas) return;
        Charts.drawSparkline(canvas, this._sparklineData, '#00aaff');
    },

    _randomLatency() {
        return Utils.randomBetween(10, 60);
    },

    _randomConnections() {
        return Utils.randomBetween(500, 5000);
    },

    _randomPacketLoss() {
        return Utils.randomFloat(0, 0.2, 2);
    },

    _getNetStatus(net) {
        // Determine status based on available network info
        if (net.connections && net.connections.length > 0) {
            return 'OPERATIONAL';
        }
        return 'OPERATIONAL';
    }
};

window.NetworkHealthComponent = NetworkHealthComponent;
