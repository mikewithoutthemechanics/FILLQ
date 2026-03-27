import { Router } from 'express';
import { DashboardService } from '../services/DashboardService.js';

const router = Router();

/**
 * GET /api/filliq/dashboard/summary
 * Get recovery summary metrics
 */
router.get('/summary', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;

    const service = new DashboardService(studioId as string);
    const summary = await service.getRecoverySummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary'
    });
  }
});

/**
 * GET /api/filliq/dashboard/fill-chart
 * Get 30-day fill rate chart data
 */
router.get('/fill-chart', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;

    const service = new DashboardService(studioId as string);
    const data = await service.getFillChartData();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching fill chart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fill chart data'
    });
  }
});

/**
 * GET /api/filliq/dashboard/teacher-brief/:classId
 * Get teacher pre-class brief
 */
router.get('/teacher-brief/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { studioId = 'default-studio' } = req.query;

    const service = new DashboardService(studioId as string);
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
    console.error('Error fetching teacher brief:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teacher brief'
    });
  }
});

/**
 * GET /api/filliq/dashboard/teacher-daily/:teacherId
 * Get all class briefs for a teacher's day
 */
router.get('/teacher-daily/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { studioId = 'default-studio' } = req.query;

    const service = new DashboardService(studioId as string);
    const briefs = await service.getTeacherClassBrief(teacherId);

    res.json({
      success: true,
      count: briefs.length,
      data: briefs
    });
  } catch (error) {
    console.error('Error fetching teacher daily brief:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teacher daily brief'
    });
  }
});

/**
 * GET /api/filliq/dashboard/at-risk-members
 * Get at-risk members for churn panel
 */
router.get('/at-risk-members', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;

    const service = new DashboardService(studioId as string);
    const members = await service.getAtRiskMembers();

    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error fetching at-risk members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch at-risk members'
    });
  }
});

/**
 * GET /api/filliq/dashboard/monthly-report
 * Generate monthly report
 */
router.get('/monthly-report', async (req, res) => {
  try {
    const { year, month, studioId = 'default-studio' } = req.query;

    const now = new Date();
    const reportYear = year ? parseInt(year as string) : now.getFullYear();
    const reportMonth = month ? parseInt(month as string) : now.getMonth() + 1;

    const service = new DashboardService(studioId as string);
    const report = await service.generateMonthlyReport(reportYear, reportMonth);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate monthly report'
    });
  }
});

export default router;
