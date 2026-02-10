import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { containerRoutes } from './routes';
import { healthCheck } from './health';
import { cleanupExpired } from './cleanup';

dotenv.config();

const app = express();
const PORT = process.env.ORCHESTRATOR_PORT || 3500;
const API_SECRET = process.env.ORCHESTRATOR_SECRET;

if (!API_SECRET) {
  console.error('\u2666 ORCHESTRATOR_SECRET is required');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint (no auth needed) - MUST be before auth middleware
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware - only our Vercel backend can call this
app.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-orchestrator-secret'];
  if (token !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Routes
app.use('/api/containers', containerRoutes);

// Cron: check container health every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    await healthCheck();
  } catch (err) {
    console.error('Health check failed:', err);
  }
});

// Cron: cleanup expired containers every hour
cron.schedule('0 * * * *', async () => {
  try {
    await cleanupExpired();
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
});

app.listen(PORT, () => {
  console.log(`\u2666 InstantWorker Orchestrator running on port ${PORT}`);
});
