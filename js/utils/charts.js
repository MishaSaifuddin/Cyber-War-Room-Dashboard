/* ============================================
   CYBER WAR ROOM - Chart Rendering Utilities
   Canvas-based charts, gauges, sparklines
   ============================================ */

const Charts = {
    drawGauge(canvas, value, max, minColor, maxColor, label) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height * 0.9;
        const radius = Math.min(width, height) * 0.7;
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        const progress = Math.min(value / max, 1);

        ctx.clearRect(0, 0, width, height);

        // Background track
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(42, 58, 74, 0.5)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Progress arc
        const arcEnd = startAngle + (endAngle - startAngle) * progress;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, arcEnd);

        // Gradient from 0 to max
        const gradient = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
        gradient.addColorStop(0, minColor);
        gradient.addColorStop(1, maxColor);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Label
        if (label) {
            ctx.fillStyle = 'rgba(136, 146, 160, 0.8)';
            ctx.font = '10px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, centerX, centerY + radius * 0.5);
        }
    },

    drawDonut(canvas, data) {
        // data = [{label, value, color}]
        if (!canvas || !data) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 5;
        const innerRadius = radius * 0.6;

        ctx.clearRect(0, 0, width, height);

        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return;

        let startAngle = -Math.PI / 2;

        data.forEach((item) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += sliceAngle;
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#141d2b';
        ctx.fill();
    },

    drawLineGraph(canvas, data, color, fill = true) {
        if (!canvas || !data || data.length < 2) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 5;

        ctx.clearRect(0, 0, width, height);

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = padding + (1 - (data[i] - min) / range) * (height - padding * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (fill) {
            ctx.lineTo(width - padding, height - padding);
            ctx.lineTo(padding, height - padding);
            ctx.closePath();
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(42, 58, 74, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * (height - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
    },

    drawBarChart(canvas, data, colors) {
        // data = [values array]
        if (!canvas || !data) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 4;

        ctx.clearRect(0, 0, width, height);

        const max = Math.max(...data);
        const barWidth = (width - padding * 2) / data.length;

        data.forEach((value, i) => {
            const barHeight = (value / max) * (height - padding * 2);
            const x = padding + i * barWidth;
            const y = height - padding - barHeight;

            const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
            gradient.addColorStop(0, colors[i] || '#00aaff');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        });
    },

    drawSparkline(canvas, data, color = '#00ff88') {
        if (!canvas || !data || data.length < 2) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 2;

        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) return;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = padding + (1 - (data[i] - min) / range) * (height - padding * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glow effect
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.restore();
    },

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

window.Charts = Charts;
