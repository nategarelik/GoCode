import { performance } from 'perf_hooks';

// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
  const start = performance.now();
  
  // Monkey-patch the response's end method
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = performance.now() - start;
    
    // Log performance metrics
    const metrics = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip
    };
    
    // You can send these metrics to your monitoring service
    if (process.env.ENABLE_MONITORING === 'true') {
      sendMetrics(metrics);
    }
    
    // Add response header
    res.setHeader('X-Response-Time', `${metrics.duration}ms`);
    
    // Call the original end method
    originalEnd.apply(res, args);
  };
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const memoryUsage = process.memoryUsage();
  return {
    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
  };
};

// CPU usage monitoring
let previousCpuUsage = process.cpuUsage();
let previousTime = Date.now();

export const cpuMonitor = () => {
  const currentCpuUsage = process.cpuUsage(previousCpuUsage);
  const currentTime = Date.now();
  const timeDiff = currentTime - previousTime;
  
  const userPercent = (currentCpuUsage.user / 1000 / timeDiff) * 100;
  const systemPercent = (currentCpuUsage.system / 1000 / timeDiff) * 100;
  
  previousCpuUsage = process.cpuUsage();
  previousTime = currentTime;
  
  return {
    user: Math.round(userPercent * 100) / 100,
    system: Math.round(systemPercent * 100) / 100,
    total: Math.round((userPercent + systemPercent) * 100) / 100
  };
};

// System metrics endpoint
export const systemMetrics = (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: memoryMonitor(),
    cpu: cpuMonitor(),
    connections: {
      active: req.app.locals.activeConnections || 0,
      total: req.app.locals.totalConnections || 0
    },
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  res.json(metrics);
};

// Track active connections
export const connectionTracker = (req, res, next) => {
  if (!req.app.locals.activeConnections) {
    req.app.locals.activeConnections = 0;
    req.app.locals.totalConnections = 0;
  }
  
  req.app.locals.activeConnections++;
  req.app.locals.totalConnections++;
  
  res.on('finish', () => {
    req.app.locals.activeConnections--;
  });
  
  next();
};

// Send metrics to monitoring service (implement your preferred service)
function sendMetrics(metrics) {
  // Example: Send to CloudWatch, Datadog, New Relic, etc.
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    // Send to New Relic
  }
  
  if (process.env.DATADOG_API_KEY) {
    // Send to Datadog
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance metrics:', metrics);
  }
}

// Graceful shutdown monitoring
export const setupGracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });
    
    // Wait for existing connections to close (with timeout)
    const shutdownTimeout = setTimeout(() => {
      console.error('Forcefully shutting down after timeout');
      process.exit(1);
    }, 30000); // 30 seconds timeout
    
    // Clear timeout if shutdown completes
    server.on('close', () => {
      clearTimeout(shutdownTimeout);
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};