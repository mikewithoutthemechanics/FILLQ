import { Router } from 'express';
import { param, query } from 'express-validator';
import { DashboardService } from '../services/DashboardService.js';
import { realtimeService } from '../services/RealtimeService.js';
import { optionalAuthMiddleware } from '../middleware/supabaseAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(optionalAuthMiddleware);

/**
 * GET /api/filliq/dashboard/stream
 * SSE (Server-Sent Events) endpoint for real-time dashboard updates
 */
router.get('/stream', (req: any, res: any) => {
  const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', studioId, timestamp: new Date().toISOString() })}\n\n`);

  realtimeService.addClient(studioId, res);

  req.on('close', () => {
    realtimeService.removeClient(studioId, res);
  });
});

/**
 * GET /api/filliq/dashboard/summary
 * Get recovery summary metrics
 */
router.get(
  '/summary',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const service = new DashboardService(studioId);
      const summary = await service.getRecoverySummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard summary'
      });
    }
  }
);

/**
 * GET /api/filliq/dashboard/fill-chart
 * Get 30-day fill rate chart data
 */
router.get(
  '/fill-chart',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const service = new DashboardService(studioId);
      const data = await service.getFillChartData();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error fetching fill chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fill chart data'
      });
    }
  }
);

/**
 * GET /api/filliq/dashboard/teacher-brief/:classId
 * Get teacher pre-class brief
 */
router.get(
  '/teacher-brief/:classId',
  [
    param('classId').isString().trim().notEmpty().withMessage('classId is required'),
    query('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { classId } = req.params;
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const service = new DashboardService(studioId);
      const brief = await service.getClassBrief(classId);

      if (!brief) {
        return res.status(404).json({
          success: false,
          error: 'Class not found'
        });
      }

      res.json({
        success: true,
        data: brief
      });
    } catch (error) {
      logger.error('Error fetching teacher brief:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teacher brief'
      });
    }
  }
);

/**
 * GET /api/filliq/dashboard/teacher-daily/:teacherId
 * Get all class briefs for a teacher's day
 */
router.get(
  '/teacher-daily/:teacherId',
  [
    param('teacherId').isString().trim().notEmpty().withMessage('teacherId is required'),
    query('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { teacherId } = req.params;
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const service = new DashboardService(studioId);
      const briefs = await service.getTeacherClassBrief(teacherId);

      res.json({
        success: true,
        count: briefs.length,
        data: briefs
      });
    } catch (error) {
      logger.error('Error fetching teacher daily brief:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teacher daily brief'
      });
    }
  }
);

/**
 * GET /api/filliq/dashboard/at-risk-members
 * Get at-risk members for churn panel
 */
router.get(
  '/at-risk-members',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const service = new DashboardService(studioId);
      const members = await service.getAtRiskMembers();

      res.json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error) {
      logger.error('Error fetching at-risk members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch at-risk members'
      });
    }
  }
);

/**
 * GET /api/filliq/dashboard/monthly-report
 * Generate monthly report
 */
router.get(
  '/monthly-report',
  [
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { year, month } = req.query;
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const now = new Date();
      const reportYear = year ? Number(year) : now.getFullYear();
      const reportMonth = month ? Number(month) : now.getMonth() + 1;

      const service = new DashboardService(studioId);
      const report = await service.generateMonthlyReport(reportYear, reportMonth);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error generating monthly report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate monthly report'
      });
    }
  }
);

export default router;
