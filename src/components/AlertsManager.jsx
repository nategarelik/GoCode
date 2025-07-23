import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, AlertTriangle, DollarSign, Clock, Activity } from 'lucide-react';
import { api } from '../utils/api';

const AlertsManager = () => {
  const [alerts, setAlerts] = useState({ cost: [], performance: [] });
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'cost',
    alertType: 'daily',
    metricType: 'response_time',
    threshold: '',
    comparison: 'greater_than',
    projectId: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/analytics/alerts');
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    try {
      if (newAlert.type === 'cost') {
        await api.post('/api/analytics/alerts/cost', {
          alertType: newAlert.alertType,
          threshold: parseFloat(newAlert.threshold),
          projectId: newAlert.projectId || null
        });
      } else {
        await api.post('/api/analytics/alerts/performance', {
          metricType: newAlert.metricType,
          threshold: parseFloat(newAlert.threshold),
          comparison: newAlert.comparison
        });
      }
      
      setShowNewAlert(false);
      setNewAlert({
        type: 'cost',
        alertType: 'daily',
        metricType: 'response_time',
        threshold: '',
        comparison: 'greater_than',
        projectId: ''
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const toggleAlert = async (type, id, enabled) => {
    try {
      await api.patch(`/api/analytics/alerts/${type}/${id}`, { enabled });
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const deleteAlert = async (type, id) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      await api.delete(`/api/analytics/alerts/${type}/${id}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getAlertIcon = (alert, type) => {
    if (type === 'cost') return DollarSign;
    switch (alert.metric_type) {
      case 'response_time': return Clock;
      case 'error_rate': return AlertTriangle;
      default: return Activity;
    }
  };

  const getAlertDescription = (alert, type) => {
    if (type === 'cost') {
      return `Alert when ${alert.alert_type} cost exceeds $${alert.threshold}${
        alert.project_id ? ` for project ${alert.project_id}` : ''
      }`;
    } else {
      return `Alert when ${alert.metric_type.replace('_', ' ')} is ${
        alert.comparison.replace('_', ' ')
      } ${alert.threshold}${
        alert.metric_type === 'error_rate' ? '%' : 'ms'
      }`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alert Configuration</h2>
        <button
          onClick={() => setShowNewAlert(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </button>
      </div>

      {/* New Alert Form */}
      {showNewAlert && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Alert</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alert Type
              </label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cost">Cost Alert</option>
                <option value="performance">Performance Alert</option>
              </select>
            </div>

            {newAlert.type === 'cost' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Period
                  </label>
                  <select
                    value={newAlert.alertType}
                    onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="total">Total</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project ID (optional)
                  </label>
                  <input
                    type="text"
                    value={newAlert.projectId}
                    onChange={(e) => setNewAlert({ ...newAlert, projectId: e.target.value })}
                    placeholder="Leave empty for all projects"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Metric
                  </label>
                  <select
                    value={newAlert.metricType}
                    onChange={(e) => setNewAlert({ ...newAlert, metricType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="response_time">Response Time</option>
                    <option value="error_rate">Error Rate</option>
                    <option value="token_usage">Token Usage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={newAlert.comparison}
                    onChange={(e) => setNewAlert({ ...newAlert, comparison: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Threshold {newAlert.type === 'cost' ? '($)' : newAlert.metricType === 'error_rate' ? '(%)' : '(ms)'}
              </label>
              <input
                type="number"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                placeholder="Enter threshold value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewAlert(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={!newAlert.threshold}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Cost Alerts
          </h3>
        </div>
        <div className="p-6">
          {alerts.cost.length === 0 ? (
            <p className="text-gray-500">No cost alerts configured</p>
          ) : (
            <div className="space-y-3">
              {alerts.cost.map((alert) => {
                const Icon = getAlertIcon(alert, 'cost');
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium">{getAlertDescription(alert, 'cost')}</p>
                        {alert.last_triggered && (
                          <p className="text-sm text-gray-500">
                            Last triggered: {new Date(alert.last_triggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alert.enabled}
                          onChange={(e) => toggleAlert('cost', alert.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button
                        onClick={() => deleteAlert('cost', alert.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Performance Alerts
          </h3>
        </div>
        <div className="p-6">
          {alerts.performance.length === 0 ? (
            <p className="text-gray-500">No performance alerts configured</p>
          ) : (
            <div className="space-y-3">
              {alerts.performance.map((alert) => {
                const Icon = getAlertIcon(alert, 'performance');
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium">{getAlertDescription(alert, 'performance')}</p>
                        {alert.last_triggered && (
                          <p className="text-sm text-gray-500">
                            Last triggered: {new Date(alert.last_triggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alert.enabled}
                          onChange={(e) => toggleAlert('performance', alert.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button
                        onClick={() => deleteAlert('performance', alert.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsManager;