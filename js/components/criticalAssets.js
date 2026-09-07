/* ============================================
   CYBER WAR ROOM - Critical Assets Component
   Uses WebSocket data when available, mock otherwise
   ============================================ */

const CriticalAssetsComponent = {
    _listEl: null,
    _unsubscribe: null,

    init() {
        this._listEl = document.getElementById('assetList');

        this._unsubscribe = DataManager.subscribe((type, data) => {
            if (type === 'update' && DataManager.isLive()) {
                this.updateFromLive(data);
            } else if (type === 'mock_tick') {
                this.renderAssetsMock();
            }
        });

        // Initial render
        this.renderAssetsMock();
    },

    updateFromLive(data) {
        if (!data) return;
        const systemInfo = data.system_info || {};
        const filesystem = data.filesystem || {};

        const assets = [
            {
                name: systemInfo.hostname || 'HOST-PC',
                type: 'SYSTEM',
                ip: 'localhost',
                risk: systemInfo.hostname ? 'HIGH' : 'MEDIUM',
                status: 'safe',
                lastScan: 'LIVE',
                icon: '&#128421;',
            },
            {
                name: 'CPU',
                type: 'PROCESSOR',
                ip: 'N/A',
                risk: 'MEDIUM',
                status: 'safe',
                lastScan: 'LIVE',
                icon: '&#9889;',
            },
            {
                name: 'MEMORY',
                type: 'RAM',
                ip: 'N/A',
                risk: 'MEDIUM',
                status: 'safe',
                lastScan: 'LIVE',
                icon: '&#128233;',
            },
            {
                name: 'DISK',
                type: 'STORAGE',
                ip: 'N/A',
                risk: 'MEDIUM',
                status: 'safe',
                lastScan: 'LIVE',
                icon: '&#128190;',
            },
        ];

        // Add suspicious files as assets with warnings
        const suspiciousFiles = filesystem.suspicious_files || [];
        suspiciousFiles.slice(0, 3).forEach(sf => {
            assets.push({
                name: sf.name || 'SUSPICIOUS_FIL',
                type: 'SUSPICIOUS',
                ip: 'FILE SYSTEM',
                risk: 'HIGH',
                status: 'critical',
                lastScan: Utils.formatDateTime(new Date(sf.created * 1000)),
                icon: '&#9888;',
            });
        });

        // Integrity changes
        const integrity = filesystem.integrity_changes || [];
        integrity.slice(0, 2).forEach(change => {
            const parts = (change.path || '').split('\\');
            const name = parts[parts.length - 1] || 'SYSTEM FILE';
            assets.push({
                name: name,
                type: 'INTEGRITY',
                ip: change.type || 'modified',
                risk: 'HIGH',
                status: 'warning',
                lastScan: 'MODIFIED',
                icon: '&#9888;',
            });
        });

        this.renderAssets(assets);
    },

    renderAssetsMock() {
        const assets = MockData.getAssets();
        this.renderAssets(assets);
    },

    renderAssets(assets) {
        if (!this._listEl) return;
        this._listEl.innerHTML = '';

        assets.slice(0, 6).forEach(asset => {
            const item = document.createElement('div');
            item.className = 'asset-item';

            const icon = document.createElement('span');
            icon.className = 'asset-status-icon';
            icon.innerHTML = asset.icon;
            icon.classList.add(asset.status);

            const info = document.createElement('div');
            info.className = 'asset-info';

            const name = document.createElement('span');
            name.className = 'asset-name';
            name.textContent = asset.name;

            const meta = document.createElement('span');
            meta.className = 'asset-meta';
            meta.textContent = `${asset.type} | ${asset.ip} | ${asset.lastScan}`;

            info.appendChild(name);
            info.appendChild(meta);

            const risk = document.createElement('span');
            risk.className = `asset-risk ${asset.risk.toLowerCase()}`;
            risk.textContent = asset.risk;

            item.appendChild(icon);
            item.appendChild(info);
            item.appendChild(risk);

            this._listEl.appendChild(item);
        });
    }
};

window.CriticalAssetsComponent = CriticalAssetsComponent;
