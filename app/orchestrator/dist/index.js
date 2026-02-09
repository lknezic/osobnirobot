"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
const node_cron_1 = require("node-cron");
const dotenv_1 = require("dotenv");
const routes_1 = require("./routes");
const health_1 = require("./health");
const cleanup_1 = require("./cleanup");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.ORCHESTRATOR_PORT || 3500;
const API_SECRET = process.env.ORCHESTRATOR_SECRET;
if (!API_SECRET) {
    console.error('\u2666 ORCHESTRATOR_SECRET is required');
    process.exit(1);
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health endpoint (no auth needed) - MUST be before auth middleware
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth middleware - only our Vercel backend can call this
app.use((req, res, next) => {
    const token = req.headers['x-orchestrator-secret'];
    if (token !== API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
// Routes
app.use('/api/containers', routes_1.containerRoutes);
// Cron: check container health every 5 minutes
node_cron_1.default.schedule('*/5 * * * *', async () => {
    try {
        await (0, health_1.healthCheck)();
    }
    catch (err) {
        console.error('Health check failed:', err);
    }
});
// Cron: cleanup expired containers every hour
node_cron_1.default.schedule('0 * * * *', async () => {
    try {
        await (0, cleanup_1.cleanupExpired)();
    }
    catch (err) {
        console.error('Cleanup failed:', err);
    }
});
app.listen(PORT, () => {
    console.log(`\u2666 OsobniRobot Orchestrator running on port ${PORT}`);
});
