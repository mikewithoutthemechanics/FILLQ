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
import { supabaseAuthMiddleware, optionalAuthMiddleware } from './middleware/supabaseAuth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/filliq/scores', scoresRouter);
app.use('/api/filliq/waitlist', waitlistRouter);
app.use('/api/filliq/churn', churnRouter);
app.use('/api/filliq/dashboard', dashboardRouter);
app.use('/api/filliq/settings', settingsRouter);
app.use('/api/filliq/whatsapp', whatsappRouter);

// Root endpoint
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
      whatsapp: '/api/filliq/whatsapp'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   FillIQ API Server                                        ║
║   AI-Powered No-Show Optimizer                             ║
║                                                            ║
║   Running on port ${PORT.toString().padEnd(40)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(43)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Start scheduled jobs
  if (process.env.NODE_ENV !== 'test') {
    startAllJobs();
  }
});

export default app;
