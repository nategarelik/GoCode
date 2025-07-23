import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  AlertCircle, Clock, Database, BarChart3
} from 'lucide-react';
import { api } from '../utils/api';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MetricCard = ({ title, value, change, icon: Icon, trend }) => {
  const isPositive = trend === 'positive' ? change >= 0 : change <= 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          <Icon className={`h-6 w-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-2 flex items-center">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(change)}% from last period
          </span>
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [summary, setSummary] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [errorRate, setErrorRate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch all analytics data
      const [summaryRes, dailyRes, costsRes, perfRes, errorRes] = await Promise.all([
        api.get('/api/analytics/summary'),
        api.get(`/api/analytics/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/api/analytics/costs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/api/analytics/performance/api_latency?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/api/analytics/errors?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      ]);

      setSummary(summaryRes.data);
      setDailyMetrics(dailyRes.data || []);
      setCostBreakdown(costsRes.data);
      setPerformance(perfRes.data || []);
      setErrorRate(errorRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'costs', 'performance', 'usage'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Cost Today"
              value={formatCurrency(summary?.data?.today?.cost || 0)}
              change={calculateChange(
                summary?.data?.today?.cost || 0,
                summary?.data?.week?.cost ? summary.data.week.cost / 7 : 0
              )}
              icon={DollarSign}
              trend="negative"
            />
            <MetricCard
              title="API Requests"
              value={formatNumber(
                dailyMetrics.reduce((sum, day) => sum + day.total_requests, 0)
              )}
              change={10}
              icon={Activity}
              trend="positive"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${Math.round(
                dailyMetrics.reduce((sum, day) => sum + (day.avg_response_time || 0), 0) / 
                (dailyMetrics.length || 1)
              )}ms`}
              change={-5}
              icon={Clock}
              trend="negative"
            />
            <MetricCard
              title="Error Rate"
              value={`${(
                dailyMetrics.reduce((sum, day) => sum + (day.error_rate || 0), 0) / 
                (dailyMetrics.length || 1) * 100
              ).toFixed(2)}%`}
              change={-2}
              icon={AlertCircle}
              trend="negative"
            />
          </div>

          {/* Daily Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Usage Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_requests"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Requests"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_cost"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Cost ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          {/* Cost by Model */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Cost by Model</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown?.byModel || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, total_cost }) => `${model}: ${formatCurrency(total_cost)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_cost"
                >
                  {(costBreakdown?.byModel || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cost by Project */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Cost by Project</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBreakdown?.byProject || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project_id" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total_cost" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Token Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Token Usage by Model</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBreakdown?.byModel || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="total_input_tokens" fill="#8884d8" name="Input Tokens" />
                <Bar dataKey="total_output_tokens" fill="#82ca9d" name="Output Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Response Time Percentiles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Response Time Percentiles</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentile" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}ms`} />
                <Bar dataKey="avg_value" fill="#8884d8" name="Average" />
                <Bar dataKey="max_value" fill="#ff8042" name="Max" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rate Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Error Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={errorRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                <Line 
                  type="monotone" 
                  dataKey="error_rate" 
                  stroke="#ff8042" 
                  name="Error Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Model Usage Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Model Usage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown?.byModel || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, request_count }) => `${model}: ${formatNumber(request_count)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="request_count"
                >
                  {(costBreakdown?.byModel || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Request Volume */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Request Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful_requests" fill="#82ca9d" name="Successful" />
                <Bar dataKey="failed_requests" fill="#ff8042" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;