/* ============================================
   CYBER WAR ROOM - Mock Data Generators
   Simulated data for the dashboard
   ============================================ */

const MockData = {
    _netSparkline: [],
    _threatTrendData: [],
    _userActivityHistory: [],
    _threatFeed: [],
    _historyInitialized: false,

    // Initialize historical data buffers
    initHistory() {
        if (this._historyInitialized) return;
        for (let i = 0; i < 30; i++) {
            this._netSparkline.push(Utils.randomBetween(20, 80));
        }
        for (let i = 0; i < 24; i++) {
            this._threatTrendData.push(Utils.randomBetween(30, 70));
        }
        this._historyInitialized = true;
    },

    /* ===== NETWORK HEALTH ===== */
    network: {
        uptime: 99.97,
        latency: 24,
        inTraffic: 1240, // Mbps
        outTraffic: 860, // Mbps
        connections: 23456,
        packetLoss: 0.02,
        status: 'OPERATIONAL',
    },

    getNetwork() {
        const net = { ...this.network };

        // Small random fluctuations
        net.latency = Utils.clamp(net.latency + Utils.randomFloat(-3, 3, 1), 5, 200);
        net.inTraffic = Utils.clamp(net.inTraffic + Utils.randomFloat(-50, 50, 0), 200, 2500);
        net.outTraffic = Utils.clamp(net.outTraffic + Utils.randomFloat(-40, 40, 0), 150, 2000);
        net.connections = Utils.clamp(net.connections + Utils.randomBetween(-50, 50), 5000, 50000);
        net.packetLoss = Utils.clamp(net.packetLoss + Utils.randomFloat(-0.01, 0.01, 2), 0, 1);

        // Status based on metrics
        if (net.latency > 150 || net.packetLoss > 0.5) net.status = 'DEGRADED';
        else if (net.latency > 100) net.status = 'WARNING';
        else net.status = 'OPERATIONAL';

        // Update sparkline
        MockData._netSparkline.push(net.connections % 100);
        if (MockData._netSparkline.length > 30) MockData._netSparkline.shift();

        return net;
    },

    /* ===== SECURITY HEALTH ===== */
    security: {
        score: 86,
        criticalVulns: 2,
        highVulns: 7,
        mediumVulns: 14,
        lowVulns: 32,
        patchCompliance: 87,
    },

    getSecurity() {
        const sec = { ...this.security };
        sec.score = Utils.clamp(sec.score + Utils.randomBetween(-2, 2), 0, 100);
        sec.patchCompliance = Utils.clamp(sec.patchCompliance + Utils.randomFloat(-0.5, 0.5, 1), 0, 100);
        return sec;
    },

    /* ===== SUSPICIOUS ACTIVITIES ===== */

    // Threat types and their templates
    _threatTemplates: [
        {
            type: 'BRUTE',
            severity: 'HIGH',
            severityColor: '#ff8800',
            templates: [
                (ip) => `Multiple failed auth attempts from ${ip}`,
                (ip) => `Brute force on SSH port 22 from ${ip}`,
                (ip) => `RDP brute force attempt from ${ip}`,
            ]
        },
        {
            type: 'SCAN',
            severity: 'MEDIUM',
            severityColor: '#ffcc00',
            templates: [
                (ip) => `Port scan detected from ${ip}`,
                (ip) => `Service enumeration by ${ip}`,
                (ip) => `Network sweep from ${ip}`,
            ]
        },
        {
            type: 'MALWARE',
            severity: 'CRITICAL',
            severityColor: '#ff3366',
            templates: [
                (ip) => `Ransomware signature detected from ${ip}`,
                (ip) => `Suspicious executable downloaded by ${ip}`,
                (ip) => `Trojan C2 communication from ${ip}`,
            ]
        },
        {
            type: 'PHISH',
            severity: 'MEDIUM',
            severityColor: '#ffcc00',
            templates: [
                (ip) => `Phishing email reported from ${ip}`,
                (ip) => `Spear-phishing attempt blocked from ${ip}`,
            ]
        },
        {
            type: 'DDOS',
            severity: 'HIGH',
            severityColor: '#ff8800',
            templates: [
                (ip) => `Possible DDoS traffic from ${ip}`,
                (ip) => `Amplified UDP traffic from ${ip}`,
            ]
        },
        {
            type: 'ANOMALY',
            severity: 'LOW',
            severityColor: '#00aaff',
            templates: [
                (ip) => `Unusual outbound traffic from ${ip}`,
                (ip) => `Anomalous behavior detected at ${ip}`,
            ]
        },
    ],

    _ipPool: [
        '185.220.101.34', '203.0.113.45', '94.102.61.88', '31.13.76.201',
        '66.240.205.110', '172.67.154.88', '104.218.116.255', '45.155.205.100',
        '91.244.176.141', '185.220.102.7', '5.188.206.35', '159.8.89.90',
        '198.12.99.102', '161.35.40.39', '167.71.158.92', '138.197.114.210',
    ],

    // Location pool for attack map
    _locPool: [
        'Moscow', 'Beijing', 'Brasília', 'Tehran', 'Karachi',
        'Lagos', 'Ho Chi Minh', 'Manila', 'Bogotá', 'Kyiv',
        'Ankara', 'Mumbai', 'Jakarta', 'Sofia', 'Bucharest',
        'Panama City', 'Havana', 'Pyongyang', 'Abuja', 'Caracas',
    ],

    getNewThreatEvent() {
        const template = Utils.randomPick(this._threatTemplates);
        const ip = Utils.randomPick(this._ipPool);
        const desc = Utils.randomPick(template.templates)(ip);
        const loc = Utils.randomPick(this._locPool);
        const now = new Date();

        return {
            time: now,
            type: template.type,
            severity: template.severity,
            severityColor: template.severityColor,
            description: desc,
            sourceIP: ip,
            location: loc,
            id: `${now.getTime()}-${Utils.randomHex(4)}`
        };
    },

    pushThreatEvent(event) {
        this._threatFeed.unshift(event);
        if (this._threatFeed.length > 50) this._threatFeed.pop();
        return this._threatFeed;
    },

    getThreatFeed() {
        return this._threatFeed;
    },

    // Activity breakdown data for donut chart
    getActivityBreakdown() {
        return [
            { label: 'Brute', value: Utils.randomBetween(15, 40), color: '#ff3366' },
            { label: 'Scanning', value: Utils.randomBetween(20, 50), color: '#ffcc00' },
            { label: 'Malware', value: Utils.randomBetween(5, 20), color: '#aa66ff' },
            { label: 'Phishing', value: Utils.randomBetween(10, 30), color: '#00aaff' },
            { label: 'DDoS', value: Utils.randomBetween(5, 15), color: '#ff8800' },
        ];
    },

    /* ===== SYSTEM STATUS ===== */
    _servers: [
        { name: 'SVR-01', role: 'WEB', ip: '10.0.1.1' },
        { name: 'SVR-02', role: 'DB', ip: '10.0.1.2' },
        { name: 'SVR-03', role: 'APP', ip: '10.0.1.3' },
        { name: 'SVR-04', role: 'EMAIL', ip: '10.0.1.4' },
        { name: 'SVR-05', role: 'DNS', ip: '10.0.1.5' },
        { name: 'SVR-06', role: 'AUTH', ip: '10.0.1.6' },
    ],

    _services: ['WEB', 'DB', 'APP', 'EMAIL', 'DNS', 'AUTH'],

    getServers() {
        return this._servers.map((server) => {
            const cpu = Utils.randomBetween(15, 85);
            const ram = Utils.randomBetween(20, 80);
            const disk = Utils.randomBetween(30, 90);

            let status = 'green';
            if (cpu > 80 || ram > 80 || disk > 92) status = 'red';
            else if (cpu > 65 || ram > 65 || disk > 80) status = 'yellow';

            return {
                ...server,
                cpu,
                ram,
                disk,
                status,
                running: status !== 'red' || Math.random() > 0.05,
                services: this._buildServices(status),
            };
        });
    },

    _buildServices(serverStatus) {
        const services = [];
        for (const svc of this._services) {
            let status = 'green';
            if (serverStatus === 'red' && Math.random() > 0.7) status = 'red';
            else if (serverStatus === 'yellow' && Math.random() > 0.8) status = 'yellow';
            services.push({ name: svc.toLowerCase(), status });
        }
        return services;
    },

    getSystemStatus() {
        return {
            servers: this.getServers(),
            criticalCount: this._servers.length - 3,
        };
    },

    /* ===== INCIDENTS ===== */
    _incidentSeverities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    _incidentTemplates: [
        { title: 'Ransomware detection', desc: 'File encryption detected' },
        { title: 'Data exfiltration', desc: 'Large outbound transfer' },
        { title: 'Zero-day exploit', desc: 'Unknown CVE exploitation' },
        { title: 'DNS tunneling', desc: 'Suspicious DNS queries' },
        { title: 'Privilege escalation', desc: 'Admin access gained' },
        { title: 'Credential stuffing', desc: 'Mass login attempts' },
        { title: 'Malicious email campaign', desc: 'Phishing wave detected' },
        { title: 'IoT device compromise', desc: 'Smart device is acting malicious' },
    ],

    createIncident() {
        const sev = Utils.weightedRandom([
            { value: 'CRITICAL', weight: 1 },
            { value: 'HIGH', weight: 3 },
            { value: 'MEDIUM', weight: 4 },
            { value: 'LOW', weight: 2 },
        ]);
        const template = Utils.randomPick(this._incidentTemplates);
        const now = new Date();

        return {
            id: `INC-${now.getFullYear()}${Utils.pad(now.getMonth()+1)}-${Utils.randomHex(4).toUpperCase()}`,
            title: template.title,
            description: template.desc,
            severity: sev,
            time: now,
            status: 'ACTIVE',
            assignee: Utils.randomPick(['J. Carter', 'M. Ross', 'A. Patel', 'S. Wong', 'K. Williams']),
        };
    },

    _activeIncidents: null,

    getIncidents() {
        if (!this._activeIncidents) {
            this._activeIncidents = [
                {
                    id: 'INC-001-7F2D',
                    title: 'Ransomware detection',
                    description: 'File encryption detected on endpoint',
                    severity: 'CRITICAL',
                    time: new Date(Date.now() - 3 * 60000),
                    status: 'ACTIVE',
                    assignee: 'J. Carter',
                },
                {
                    id: 'INC-001-9B3A',
                    title: 'Data exfiltration',
                    description: 'Large outbound data transfer',
                    severity: 'HIGH',
                    time: new Date(Date.now() - 12 * 60000),
                    status: 'ACTIVE',
                    assignee: 'M. Ross',
                },
                {
                    id: 'INC-001-4D8C',
                    title: 'DNS tunneling',
                    description: 'Suspicious DNS queries to C2',
                    severity: 'MEDIUM',
                    time: new Date(Date.now() - 45 * 60000),
                    status: 'INVESTIGATING',
                    assignee: 'A. Patel',
                },
            ];
        }
        return this._activeIncidents;
    },

    getIncidentStats() {
        if (!this._activeIncidents) {
            this._activeIncidents = this.getIncidents();
        }

        let critical = 0, high = 0, medium = 0, low = 0;
        this._activeIncidents.forEach(inc => {
            if (inc.severity === 'CRITICAL') critical++;
            else if (inc.severity === 'HIGH') high++;
            else if (inc.severity === 'MEDIUM') medium++;
            else low++;
        });

        return {
            critical,
            high,
            medium,
            low,
            total: this._activeIncidents.length,
            avgResponse: '4m 32s',
        };
    },

    modifyIncidents() {
        if (Math.random() > 0.7) {
            // Add a new incident occasionally
            const newInc = this.createIncident();
            this._activeIncidents.unshift(newInc);
        }

        if (Math.random() > 0.8 && this._activeIncidents.length > 2) {
            // Resolve one occasionally
            this._activeIncidents.pop();
        }

        return this._activeIncidents;
    },

    /* ===== CRITICAL ASSETS ===== */
    getAssets() {
        return [
            { name: 'PAYMENT DB', type: 'Database', ip: '10.0.5.1', risk: 'HIGH', status: 'critical', lastScan: Utils.formatDateTime(new Date(Date.now() - 5 * 60000)), icon: '&#128272;' },
            { name: 'AUTH SERVER', type: 'Authentication', ip: '10.0.2.3', risk: 'HIGH', status: 'safe', lastScan: Utils.formatDateTime(new Date(Date.now() - 15 * 60000)), icon: '&#128274;' },
            { name: 'HR DATABASE', type: 'Sensitive Data', ip: '10.0.5.4', risk: 'MEDIUM', status: 'warning', lastScan: Utils.formatDateTime(new Date(Date.now() - 32 * 60000)), icon: '&#128270;' },
            { name: 'MAIL GATEWAY', type: 'Email', ip: '10.0.4.1', risk: 'MEDIUM', status: 'safe', lastScan: Utils.formatDateTime(new Date(Date.now() - 8 * 60000)), icon: '&#128231;' },
            { name: 'API GATEWAY', type: 'Application', ip: '10.0.3.1', risk: 'HIGH', status: 'safe', lastScan: Utils.formatDateTime(new Date(Date.now() - 22 * 60000)), icon: '&#128268;' },
            { name: 'FILE STORAGE', type: 'Storage', ip: '10.0.6.1', risk: 'MEDIUM', status: 'safe', lastScan: Utils.formatDateTime(new Date(Date.now() - 41 * 60000)), icon: '&#128193;' },
        ];
    },

    /* ===== USER ACTIVITIES ===== */
    _userNames: [
        'jsmith', 'mrodriguez', 'kwilson', 'nthompson', 'bpatel',
        'tnguyen', 'slee', 'mjohnson', 'rgarcia', 'dellison',
    ],

    _userActions: [
        { type: 'login', msg: 'successful login' },
        { type: 'login', msg: 'successful login' },
        { type: 'logout', msg: 'session logout' },
        { type: 'login', msg: 'successful login' },
        { type: 'login', msg: 'successful login' },
        { type: 'failed', msg: 'failed login attempt' },
        { type: 'privileged', msg: 'privileged command executed' },
        { type: 'login', msg: 'successful login' },
    ],

    getUserActivity() {
        const action = Utils.randomPick(this._userActions);
        const user = Utils.randomPick(this._userNames);
        const now = new Date();

        return {
            user,
            action: action.type,
            message: action.msg,
            time: now,
            ip: Utils.randomIP(),
        };
    },

    getActiveSessions() {
        return Utils.randomBetween(200, 300);
    },

    getPrivilegedUsers() {
        return 18;
    },

    getFailedLogins() {
        return Utils.randomBetween(5, 25);
    },

    /* ===== THREAT LEVELS ===== */
    _threatCategories: [
        { name: 'MALWARE', color: '#aa66ff', value: 45 },
        { name: 'PHISHING', color: '#00aaff', value: 30 },
        { name: 'DDoS', color: '#ff8800', value: 20 },
        { name: 'INSIDER', color: '#ffcc00', value: 15 },
        { name: 'APT', color: '#ff3366', value: 10 },
        { name: 'RANSOM', color: '#ff4488', value: 25 },
    ],

    getThreatLevel() {
        return Utils.randomBetween(45, 75);
    },

    getThreatCategories() {
        return this._threatCategories.map(cat => ({
            ...cat,
            value: Utils.clamp(cat.value + Utils.randomBetween(-5, 5), 0, 100),
        }));
    },

    updateThreatTrend() {
        this._threatTrendData.push(Utils.randomBetween(35, 75));
        if (this._threatTrendData.length > 24) this._threatTrendData.shift();
        return this._threatTrendData;
    },

    getThreatTrend() {
        return this._threatTrendData;
    },

    /* ===== OPERATIONAL READINESS ===== */
    getReadiness() {
        return Utils.randomBetween(85, 95);
    },

    getTeam() {
        return [
            { name: 'J. Carter', role: 'SOC LEAD', status: 'green' },
            { name: 'M. Ross', role: 'T3 ANALYST', status: 'green' },
            { name: 'A. Patel', role: 'T2 ANALYST', status: 'yellow' },
            { name: 'S. Wong', role: 'IR SPECIALIST', status: 'green' },
        ];
    },

    getCapabilities() {
        return [
            { name: 'INCIDENT RESPONSE', value: 95 },
            { name: 'THREAT INTELLIGENCE', value: 88 },
            { name: 'FORENSICS', value: 82 },
            { name: 'VULNERABILITY MGMT', value: 90 },
        ];
    },
};

MockData.initHistory();

window.MockData = MockData;
