// Performance monitoring utilities

export const measurePerformance = (metricName, startMark, endMark) => {
  if ('performance' in window) {
    try {
      performance.measure(metricName, startMark, endMark);
      const measure = performance.getEntriesByName(metricName)[0];
      console.log(`${metricName}: ${measure.duration}ms`);
      
      // Send to analytics if available
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: metricName,
          value: Math.round(measure.duration)
        });
      }
      
      return measure.duration;
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }
};

// Mark performance points
export const markPerformance = (markName) => {
  if ('performance' in window && performance.mark) {
    performance.mark(markName);
  }
};

// Enhanced Web Vitals monitoring with thresholds and analytics
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, onINP, onFCP, onLCP, onCLS, onTTFB }) => {
      // Use the newer API methods for better accuracy
      onCLS(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
      
      // Include new INP metric if available
      if (onINP) {
        onINP(onPerfEntry);
      } else {
        // Fallback to FID for older versions
        getFID(onPerfEntry);
      }
    }).catch(err => {
      console.error('Failed to load web-vitals:', err);
    });
  }
};

// Web Vitals thresholds for performance assessment
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 }
};

// Enhanced Web Vitals reporting with analytics and local storage
export const initWebVitalsReporting = () => {
  const vitalsData = [];
  
  const sendToAnalytics = (metric) => {
    // Determine performance rating
    const threshold = WEB_VITALS_THRESHOLDS[metric.name];
    let rating = 'poor';
    
    if (threshold) {
      if (metric.value <= threshold.good) {
        rating = 'good';
      } else if (metric.value <= threshold.needsImprovement) {
        rating = 'needs-improvement';
      }
    }

    const vitalsEntry = {
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };

    vitalsData.push(vitalsEntry);

    // Log to console for development
    console.log('Web Vital:', vitalsEntry);

    // Store in localStorage for analytics
    try {
      const existingData = JSON.parse(localStorage.getItem('webVitals') || '[]');
      existingData.push(vitalsEntry);
      
      // Keep only last 50 entries to avoid storage bloat
      if (existingData.length > 50) {
        existingData.splice(0, existingData.length - 50);
      }
      
      localStorage.setItem('webVitals', JSON.stringify(existingData));
    } catch (error) {
      console.error('Failed to store web vitals data:', error);
    }

    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: rating,
        custom_parameter_2: metric.id
      });
    }

    // Send to custom analytics endpoint if configured
    if (window.ANALYTICS_ENDPOINT) {
      fetch(window.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vitalsEntry)
      }).catch(error => {
        console.error('Failed to send vitals to analytics:', error);
      });
    }
  };

  // Initialize Web Vitals reporting
  reportWebVitals(sendToAnalytics);

  // Return getter for collected data
  return {
    getData: () => vitalsData,
    getStoredData: () => {
      try {
        return JSON.parse(localStorage.getItem('webVitals') || '[]');
      } catch {
        return [];
      }
    },
    clearStoredData: () => {
      localStorage.removeItem('webVitals');
    }
  };
};

// Custom performance observer
export const observePerformance = () => {
  if ('PerformanceObserver' in window) {
    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.log('Long task observer not supported');
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Navigation timing:', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.fetchStart,
            domComplete: entry.domComplete - entry.fetchStart
          });
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      console.log('Navigation observer not supported');
    }
  }
};

// Resource timing analysis
export const analyzeResourceTiming = () => {
  if ('performance' in window && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const grouped = resources.reduce((acc, resource) => {
      const type = resource.initiatorType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push({
        name: resource.name,
        duration: resource.duration,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize
      });
      return acc;
    }, {});
    
    console.log('Resource timing by type:', grouped);
    return grouped;
  }
};

// Memory usage monitoring (Chrome only)
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      percentUsed: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
    };
  }
  return null;
};

// FPS monitoring
export const monitorFPS = (callback) => {
  let fps = 0;
  let lastTime = performance.now();
  let frames = 0;
  
  const calculateFPS = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
      
      if (callback) {
        callback(fps);
      }
    }
    
    requestAnimationFrame(calculateFPS);
  };
  
  requestAnimationFrame(calculateFPS);
  
  // Return cleanup function
  return () => {
    // Cancel animation frame
    frames = -1;
  };
};