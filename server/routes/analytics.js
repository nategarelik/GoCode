import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUsageReport,
  getDailyReport,
  getCostBreakdown,
  getPerformanceReport,
  getErrorRateReport,
  checkAlerts,
  statements
} from '../database/analyticsDb.js';

const router = express.Router();

// Get usage metrics
router.get('/usage', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const usage = getUsageReport(
      start.toISOString(),
      end.toISOString(),
      projectId || null
    );
    
    res.json({
      success: true,
      data: usage,
      period: { start: start.toISOString(), end: end.toISOString() }
    });
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get daily aggregated metrics
router.get('/daily', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const daily = getDailyReport(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
      projectId || null
    );
    
    res.json({
      success: true,
      data: daily,
      period: { start: start.toISOString(), end: end.toISOString() }
    });
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cost breakdown
router.get('/costs', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const costs = getCostBreakdown(
      start.toISOString(),
      end.toISOString()
    );
    
    res.json({
      success: true,
      data: costs,
      period: { start: start.toISOString(), end: end.toISOString() }
    });
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance metrics
router.get('/performance/:metricType', authenticateToken, (req, res) => {
  try {
    const { metricType } = req.params;
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 24 * 60 * 60 * 1000);
    
    const performance = getPerformanceReport(
      metricType,
      start.toISOString(),
      end.toISOString()
    );
    
    res.json({
      success: true,
      data: performance,
      metricType,
      period: { start: start.toISOString(), end: end.toISOString() }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get error rate report
router.get('/errors', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const errors = getErrorRateReport(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
    
    res.json({
      success: true,
      data: errors,
      period: { start: start.toISOString(), end: end.toISOString() }
    });
  } catch (error) {
    console.error('Error fetching error rate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get model pricing
router.get('/pricing', authenticateToken, (req, res) => {
  try {
    const pricing = statements.getAllModelPricing.all();
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update model pricing
router.post('/pricing', authenticateToken, (req, res) => {
  try {
    const { model, inputTokenPrice, outputTokenPrice } = req.body;
    
    const stmt = statements.db.prepare(`
      INSERT OR REPLACE INTO model_pricing (model, input_token_price, output_token_price)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(model, inputTokenPrice, outputTokenPrice);
    
    res.json({
      success: true,
      message: 'Pricing updated successfully'
    });
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get alerts configuration
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const costAlerts = statements.getCostAlerts.all();
    const perfAlerts = statements.getPerformanceAlerts.all();
    
    res.json({
      success: true,
      data: {
        cost: costAlerts,
        performance: perfAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create cost alert
router.post('/alerts/cost', authenticateToken, (req, res) => {
  try {
    const { alertType, threshold, projectId } = req.body;
    
    const stmt = statements.db.prepare(`
      INSERT INTO cost_alerts (alert_type, threshold, project_id)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(alertType, threshold, projectId || null);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating cost alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create performance alert
router.post('/alerts/performance', authenticateToken, (req, res) => {
  try {
    const { metricType, threshold, comparison } = req.body;
    
    const stmt = statements.db.prepare(`
      INSERT INTO performance_alerts (metric_type, threshold, comparison)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(metricType, threshold, comparison);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating performance alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle alert
router.patch('/alerts/:type/:id', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    const { enabled } = req.body;
    
    const table = type === 'cost' ? 'cost_alerts' : 'performance_alerts';
    const stmt = statements.db.prepare(`
      UPDATE ${table} SET enabled = ? WHERE id = ?
    `);
    
    stmt.run(enabled ? 1 : 0, id);
    
    res.json({
      success: true,
      message: 'Alert updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete alert
router.delete('/alerts/:type/:id', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    
    const table = type === 'cost' ? 'cost_alerts' : 'performance_alerts';
    const stmt = statements.db.prepare(`
      DELETE FROM ${table} WHERE id = ?
    `);
    
    stmt.run(id);
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check and get triggered alerts
router.get('/alerts/check', authenticateToken, (req, res) => {
  try {
    const triggered = checkAlerts();
    
    res.json({
      success: true,
      data: triggered
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get summary statistics
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get various time period costs
    const todayCosts = getCostBreakdown(today.toISOString(), now.toISOString());
    const weekCosts = getCostBreakdown(weekAgo.toISOString(), now.toISOString());
    const monthCosts = getCostBreakdown(monthAgo.toISOString(), now.toISOString());
    
    // Calculate totals
    const calculateTotal = (costs) => {
      return costs.byProject.reduce((sum, proj) => sum + proj.total_cost, 0);
    };
    
    res.json({
      success: true,
      data: {
        today: {
          cost: calculateTotal(todayCosts),
          breakdown: todayCosts
        },
        week: {
          cost: calculateTotal(weekCosts),
          breakdown: weekCosts
        },
        month: {
          cost: calculateTotal(monthCosts),
          breakdown: monthCosts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;