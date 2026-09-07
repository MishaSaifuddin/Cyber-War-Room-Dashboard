/* ============================================
   CYBER WAR ROOM - Utility Helper Functions
   ============================================ */

const Utils = {
    pad: (num, size = 2) => String(num).padStart(size, '0'),

    formatTime: (date) => {
        return `${Utils.pad(date.getUTCHours())}:${Utils.pad(date.getUTCMinutes())}:${Utils.pad(date.getUTCSeconds())}`;
    },

    formatDateTime: (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);

        if (diff < 5) return 'just now';
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    },

    formatBytes: (bytes) => {
        if (bytes > 1000000000000) return `${(bytes / 1000000000000).toFixed(2)} TB`;
        if (bytes > 1000000000) return `${(bytes / 1000000000).toFixed(2)} GB`;
        if (bytes > 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
        if (bytes > 1000) return `${(bytes / 1000).toFixed(2)} KB`;
        return `${bytes} B`;
    },

    formatBandwidth: (mbps) => {
        if (mbps > 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
        return `${mbps.toFixed(2)} Mbps`;
    },

    randomBetween: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    randomFloat: (min, max, decimals = 2) => {
        const val = Math.random() * (max - min) + min;
        return parseFloat(val.toFixed(decimals));
    },

    randomPick: (arr) => arr[Math.floor(Math.random() * arr.length)],

    randomIP: () => {
        return `${Utils.randomBetween(10, 223)}.${Utils.randomBetween(0, 255)}.${Utils.randomBetween(0, 255)}.${Utils.randomBetween(1, 254)}`;
    },

    randomHex: (length = 8) => {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    },

    clamp: (num, min, max) => Math.min(Math.max(num, min), max),

    lerp: (start, end, t) => start + (end - start) * t,

    randomFromList: (list) => list[Math.floor(Math.random() * list.length)],

    weightedRandom: (items) => {
        // items = [{value: x, weight: y}]
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item.value;
        }
        return items[items.length - 1].value;
    },

    nowTimestamp: () => Date.now(),

    hasElapsed: (lastTime, interval) => (Date.now() - lastTime) >= interval,
};

window.Utils = Utils;
