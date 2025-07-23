import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, DollarSign, Clock, Activity } from 'lucide-react';

const AlertNotification = ({ alerts, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation to complete
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (alert) => {
    if (alert.type === 'cost') return DollarSign;
    switch (alert.alert?.metric_type) {
      case 'response_time': return Clock;
      case 'error_rate': return AlertTriangle;
      default: return Activity;
    }
  };

  const getAlertMessage = (alert) => {
    if (alert.type === 'cost') {
      return `Cost alert: ${alert.alert.alert_type} spending exceeded $${alert.threshold}${
        alert.alert.project_id ? ` for project ${alert.alert.project_id}` : ''
      }. Current: $${alert.current.toFixed(2)}`;
    } else {
      return `Performance alert: ${alert.alert.metric_type.replace('_', ' ')} ${
        alert.alert.comparison.replace('_', ' ')
      } ${alert.threshold}`;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {alerts.length} Alert{alerts.length > 1 ? 's' : ''} Triggered
            </h3>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, index) => {
            const Icon = getAlertIcon(alert);
            return (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300">
                  {getAlertMessage(alert)}
                </p>
              </div>
            );
          })}
          {alerts.length > 3 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ...and {alerts.length - 3} more
            </p>
          )}
        </div>
        
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              // Navigate to analytics alerts tab
              window.dispatchEvent(new CustomEvent('navigate-to-analytics', { 
                detail: { view: 'alerts' } 
              }));
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All Alerts →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertNotification;