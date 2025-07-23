import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize analytics database
const analyticsDb = new Database(join(__dirname, 'analytics.db'));
analyticsDb.pragma('journal_mode = WAL');

// Check if tables exist, if not create them
const tableExists = analyticsDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usage_metrics'").get();
if (!tableExists) {
  // Execute analytics schema
  const schema = readFileSync(join(__dirname, 'analytics.sql'), 'utf8');
  analyticsDb.exec(schema);
  console.log('Analytics database tables created');
}

// Prepared statements for common operations
const statements = {
  // Insert usage metric
  insertUsage: analyticsDb.prepare(`
    INSERT INTO usage_metrics (
      project_id, model, input_tokens, output_tokens, total_tokens,
      cost, response_time, status, error_message, user_id, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  // Insert performance metric
  insertPerformance: analyticsDb.prepare(`
    INSERT INTO performance_metrics (
      metric_type, value, model, project_id, percentile
    ) VALUES (?, ?, ?, ?, ?)
  `),
  
  // Update daily metrics
  upsertDailyMetrics: analyticsDb.prepare(`
    INSERT INTO daily_metrics (
      date, project_id, model, total_requests, successful_requests,
      failed_requests, total_input_tokens, total_output_tokens,
      total_cost, avg_response_time, error_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date, project_id, model) DO UPDATE SET
      total_requests = total_requests + excluded.total_requests,
      successful_requests = successful_requests + excluded.successful_requests,
      failed_requests = failed_requests + excluded.failed_requests,
      total_input_tokens = total_input_tokens + excluded.total_input_tokens,
      total_output_tokens = total_output_tokens + excluded.total_output_tokens,
      total_cost = total_cost + excluded.total_cost,
      avg_response_time = (
        (avg_response_time * total_requests + excluded.avg_response_time * excluded.total_requests)
        / (total_requests + excluded.total_requests)
      ),
      error_rate = CAST(failed_requests + excluded.failed_requests AS REAL) / 
                   CAST(total_requests + excluded.total_requests AS REAL)
  `),
  
  // Get usage metrics
  getUsageMetrics: analyticsDb.prepare(`
    SELECT * FROM usage_metrics
    WHERE timestamp >= ? AND timestamp <= ?
    ${`AND project_id = ?`.repeat(1)}
    ORDER BY timestamp DESC
    LIMIT ?
  `),
  
  // Get daily metrics
  getDailyMetrics: analyticsDb.prepare(`
    SELECT * FROM daily_metrics
    WHERE date >= ? AND date <= ?
    ${`AND project_id = ?`.repeat(1)}
    ORDER BY date DESC
  `),
  
  // Get model pricing
  getModelPricing: analyticsDb.prepare(`
    SELECT * FROM model_pricing WHERE model = ?
  `),
  
  // Get all model pricing
  getAllModelPricing: analyticsDb.prepare(`
    SELECT * FROM model_pricing ORDER BY model
  `),
  
  // Get cost alerts
  getCostAlerts: analyticsDb.prepare(`
    SELECT * FROM cost_alerts WHERE enabled = 1
  `),
  
  // Get performance alerts
  getPerformanceAlerts: analyticsDb.prepare(`
    SELECT * FROM performance_alerts WHERE enabled = 1
  `),
  
  // Update alert triggered time
  updateAlertTriggered: analyticsDb.prepare(`
    UPDATE cost_alerts SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?
  `),
  
  // Get total cost by project
  getTotalCostByProject: analyticsDb.prepare(`
    SELECT 
      project_id,
      SUM(cost) as total_cost,
      COUNT(*) as request_count,
      SUM(total_tokens) as total_tokens
    FROM usage_metrics
    WHERE timestamp >= ? AND timestamp <= ?
    GROUP BY project_id
    ORDER BY total_cost DESC
  `),
  
  // Get cost by model
  getCostByModel: analyticsDb.prepare(`
    SELECT 
      model,
      SUM(cost) as total_cost,
      COUNT(*) as request_count,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens
    FROM usage_metrics
    WHERE timestamp >= ? AND timestamp <= ?
    GROUP BY model
    ORDER BY total_cost DESC
  `),
  
  // Get performance percentiles
  getPerformancePercentiles: analyticsDb.prepare(`
    SELECT 
      percentile,
      AVG(value) as avg_value,
      MIN(value) as min_value,
      MAX(value) as max_value
    FROM performance_metrics
    WHERE metric_type = ? 
      AND timestamp >= ? 
      AND timestamp <= ?
    GROUP BY percentile
    ORDER BY percentile
  `),
  
  // Get error rate over time
  getErrorRate: analyticsDb.prepare(`
    SELECT 
      date,
      SUM(failed_requests) as failed,
      SUM(total_requests) as total,
      AVG(error_rate) as error_rate
    FROM daily_metrics
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date
  `)
};

// Helper functions
export function calculateCost(model, inputTokens, outputTokens) {
  const pricing = statements.getModelPricing.get(model);
  if (!pricing) {
    console.warn(`No pricing found for model: ${model}`);
    return 0;
  }
  
  const inputCost = (inputTokens / 1000000) * pricing.input_token_price;
  const outputCost = (outputTokens / 1000000) * pricing.output_token_price;
  return inputCost + outputCost;
}

export function recordUsage(data) {
  const cost = calculateCost(data.model, data.inputTokens, data.outputTokens);
  const totalTokens = data.inputTokens + data.outputTokens;
  
  statements.insertUsage.run(
    data.projectId || null,
    data.model,
    data.inputTokens,
    data.outputTokens,
    totalTokens,
    cost,
    data.responseTime || null,
    data.status || 'success',
    data.errorMessage || null,
    data.userId || null,
    data.sessionId || null
  );
  
  // Update daily metrics
  const date = new Date().toISOString().split('T')[0];
  statements.upsertDailyMetrics.run(
    date,
    data.projectId || null,
    data.model,
    1, // total_requests
    data.status === 'success' ? 1 : 0, // successful_requests
    data.status !== 'success' ? 1 : 0, // failed_requests
    data.inputTokens,
    data.outputTokens,
    cost,
    data.responseTime || 0,
    data.status !== 'success' ? 1.0 : 0.0 // error_rate
  );
  
  return { cost, totalTokens };
}

export function recordPerformance(metricType, value, model, projectId = null, percentile = null) {
  statements.insertPerformance.run(metricType, value, model, projectId, percentile);
}

export function getUsageReport(startDate, endDate, projectId = null) {
  const params = [startDate, endDate];
  if (projectId) params.push(projectId);
  params.push(1000); // limit
  
  return statements.getUsageMetrics.all(...params);
}

export function getDailyReport(startDate, endDate, projectId = null) {
  const params = [startDate, endDate];
  if (projectId) params.push(projectId);
  
  return statements.getDailyMetrics.all(...params);
}

export function getCostBreakdown(startDate, endDate) {
  return {
    byProject: statements.getTotalCostByProject.all(startDate, endDate),
    byModel: statements.getCostByModel.all(startDate, endDate)
  };
}

export function getPerformanceReport(metricType, startDate, endDate) {
  return statements.getPerformancePercentiles.all(metricType, startDate, endDate);
}

export function getErrorRateReport(startDate, endDate) {
  return statements.getErrorRate.all(startDate, endDate);
}

export function checkAlerts() {
  const costAlerts = statements.getCostAlerts.all();
  const perfAlerts = statements.getPerformanceAlerts.all();
  
  const triggered = [];
  
  // Check cost alerts
  for (const alert of costAlerts) {
    let currentCost = 0;
    const now = new Date();
    let startDate;
    
    switch (alert.alert_type) {
      case 'daily':
        startDate = new Date(now.toISOString().split('T')[0]);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'total':
        startDate = new Date('2000-01-01');
        break;
    }
    
    const costs = statements.getTotalCostByProject.all(
      startDate.toISOString(),
      now.toISOString()
    );
    
    const projectCost = costs.find(c => c.project_id === alert.project_id);
    if (projectCost && projectCost.total_cost > alert.threshold) {
      triggered.push({
        type: 'cost',
        alert,
        current: projectCost.total_cost,
        threshold: alert.threshold
      });
      statements.updateAlertTriggered.run(alert.id);
    }
  }
  
  return triggered;
}

// Export database instance
export { analyticsDb as db };

// Export statements object
export { statements };

// Default export
export default {
  db: analyticsDb,
  statements,
  calculateCost,
  recordUsage,
  recordPerformance,
  getUsageReport,
  getDailyReport,
  getCostBreakdown,
  getPerformanceReport,
  getErrorRateReport,
  checkAlerts
};