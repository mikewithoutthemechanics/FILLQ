import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { startAllJobs } from './jobs/index.js';

// Import routes
import scoresRouter from './routes/scores.js';
import waitlistRouter from './routes/waitlist.js';
import churnRouter from './routes/churn.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import whatsappRouter from './routes/whatsapp.js';
import integrationsRouter from './routes/integrations.js';
import { apiLimiter, webhookLimiter } from './middleware/rateLimit.js';
import { logger } from './lib/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Apply rate limiters
app.use('/api/filliq/whatsapp/webhook', webhookLimiter);
app.use('/api/filliq/integrations/webhook', webhookLimiter);
app.use('/api/filliq/', apiLimiter);

// Health check and metrics endpoint
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    }
  });
});

// API routes
app.use('/api/filliq/scores', scoresRouter);
app.use('/api/filliq/waitlist', waitlistRouter);
app.use('/api/filliq/churn', churnRouter);
app.use('/api/filliq/dashboard', dashboardRouter);
app.use('/api/filliq/settings', settingsRouter);
app.use('/api/filliq/whatsapp', whatsappRouter);
app.use('/api/filliq/integrations', integrationsRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'FillIQ API',
    version: '1.0.0',
    description: 'AI-Powered No-Show Optimizer for Yoga & Pilates Studios',
    endpoints: {
      health: '/health',
      scores: '/api/filliq/scores',
      waitlist: '/api/filliq/waitlist',
      churn: '/api/filliq/churn',
      dashboard: '/api/filliq/dashboard',
      settings: '/api/filliq/settings',
      whatsapp: '/api/filliq/whatsapp',
      integrations: '/api/filliq/integrations'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`FillIQ API Server running on port ${PORT}`);
    startAllJobs();
  });
}

export default app;
