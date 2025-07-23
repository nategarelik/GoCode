import { recordUsage, recordPerformance } from '../database/analyticsDb.js';

// Middleware to track Claude API usage
export const trackUsage = (req, res, next) => {
  // Store the start time
  req.analyticsStartTime = Date.now();
  
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method to capture response data
  res.json = function(data) {
    // Calculate response time
    const responseTime = Date.now() - req.analyticsStartTime;
    
    // Extract metrics from the response
    if (data && data.usage) {
      const analyticsData = {
        projectId: req.body?.projectId || req.params?.projectId || 'default',
        model: data.model || req.body?.model || 'claude-3-5-sonnet-20241022',
        inputTokens: data.usage.input_tokens || 0,
        outputTokens: data.usage.output_tokens || 0,
        responseTime,
        status: data.error ? 'error' : 'success',
        errorMessage: data.error?.message || null,
        userId: req.user?.id || null,
        sessionId: req.sessionId || req.headers['x-session-id'] || null
      };
      
      // Record usage asynchronously
      process.nextTick(() => {
        try {
          recordUsage(analyticsData);
          
          // Record performance metrics
          recordPerformance('api_latency', responseTime, analyticsData.model, analyticsData.projectId);
          
          // Calculate percentiles (simplified - in production, use proper percentile calculation)
          const percentile = responseTime < 1000 ? 50 : 
                           responseTime < 2000 ? 75 : 
                           responseTime < 3000 ? 90 : 
                           responseTime < 5000 ? 95 : 99;
          
          recordPerformance('api_latency', responseTime, analyticsData.model, analyticsData.projectId, percentile);
        } catch (error) {
          console.error('Error recording analytics:', error);
        }
      });
    }
    
    // Call the original json method
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware to track general performance
export const trackPerformance = (metricType) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Hook into response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const projectId = req.body?.projectId || req.params?.projectId || 'default';
      const model = req.body?.model || 'claude-3-5-sonnet-20241022';
      
      process.nextTick(() => {
        try {
          recordPerformance(metricType, duration, model, projectId);
        } catch (error) {
          console.error('Error recording performance:', error);
        }
      });
    });
    
    next();
  };
};