import React, { useState } from 'react';
import { FileText, Download, Calendar, Send, BarChart2 } from 'lucide-react';
import { api } from '../utils/api';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [projectId, setProjectId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      if (projectId) {
        params.append('projectId', projectId);
      }

      let data = {};
      
      switch (reportType) {
        case 'summary':
          const [usage, costs, errors] = await Promise.all([
            api.get(`/api/analytics/daily?${params}`),
            api.get(`/api/analytics/costs?${params}`),
            api.get(`/api/analytics/errors?${params}`)
          ]);
          data = {
            usage: usage.data.data,
            costs: costs.data.data,
            errors: errors.data.data
          };
          break;
          
        case 'cost':
          const costRes = await api.get(`/api/analytics/costs?${params}`);
          data = costRes.data.data;
          break;
          
        case 'performance':
          const perfRes = await api.get(`/api/analytics/performance/api_latency?${params}`);
          data = perfRes.data.data;
          break;
          
        case 'usage':
          const usageRes = await api.get(`/api/analytics/usage?${params}`);
          data = usageRes.data.data;
          break;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const report = generateReportContent();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-analytics-${reportType}-${dateRange.start}-to-${dateRange.end}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportContent = () => {
    const title = `# Claude Analytics Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n\n`;
    const period = `**Period:** ${dateRange.start} to ${dateRange.end}\n`;
    const project = projectId ? `**Project:** ${projectId}\n` : '';
    const generated = `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    let content = title + period + project + generated;
    
    switch (reportType) {
      case 'summary':
        content += generateSummaryReport(reportData);
        break;
      case 'cost':
        content += generateCostReport(reportData);
        break;
      case 'performance':
        content += generatePerformanceReport(reportData);
        break;
      case 'usage':
        content += generateUsageReport(reportData);
        break;
    }
    
    return content;
  };

  const generateSummaryReport = (data) => {
    let report = '## Executive Summary\n\n';
    
    // Calculate totals
    const totalCost = data.costs.byProject.reduce((sum, p) => sum + p.total_cost, 0);
    const totalRequests = data.usage.reduce((sum, d) => sum + d.total_requests, 0);
    const avgErrorRate = data.errors.reduce((sum, e) => sum + e.error_rate, 0) / (data.errors.length || 1);
    
    report += `### Key Metrics\n\n`;
    report += `- **Total Cost:** $${totalCost.toFixed(2)}\n`;
    report += `- **Total Requests:** ${totalRequests.toLocaleString()}\n`;
    report += `- **Average Error Rate:** ${(avgErrorRate * 100).toFixed(2)}%\n\n`;
    
    report += `### Cost Breakdown by Model\n\n`;
    report += '| Model | Cost | Requests | Input Tokens | Output Tokens |\n';
    report += '|-------|------|----------|--------------|---------------|\n';
    data.costs.byModel.forEach(m => {
      report += `| ${m.model} | $${m.total_cost.toFixed(2)} | ${m.request_count.toLocaleString()} | ${m.total_input_tokens.toLocaleString()} | ${m.total_output_tokens.toLocaleString()} |\n`;
    });
    
    report += `\n### Daily Usage Trend\n\n`;
    report += '| Date | Requests | Successful | Failed | Cost | Error Rate |\n';
    report += '|------|----------|------------|--------|------|------------|\n';
    data.usage.slice(0, 10).forEach(d => {
      report += `| ${d.date} | ${d.total_requests} | ${d.successful_requests} | ${d.failed_requests} | $${d.total_cost.toFixed(2)} | ${(d.error_rate * 100).toFixed(2)}% |\n`;
    });
    
    return report;
  };

  const generateCostReport = (data) => {
    let report = '## Cost Analysis Report\n\n';
    
    const totalCost = data.byProject.reduce((sum, p) => sum + p.total_cost, 0);
    
    report += `### Total Cost: $${totalCost.toFixed(2)}\n\n`;
    
    report += `### Cost by Project\n\n`;
    report += '| Project | Cost | Percentage | Requests | Tokens |\n';
    report += '|---------|------|------------|----------|--------|\n';
    data.byProject.forEach(p => {
      const percentage = (p.total_cost / totalCost * 100).toFixed(1);
      report += `| ${p.project_id || 'Default'} | $${p.total_cost.toFixed(2)} | ${percentage}% | ${p.request_count.toLocaleString()} | ${p.total_tokens.toLocaleString()} |\n`;
    });
    
    report += `\n### Cost by Model\n\n`;
    report += '| Model | Cost | Percentage | Input $/1M | Output $/1M |\n';
    report += '|-------|------|------------|------------|-------------|\n';
    data.byModel.forEach(m => {
      const percentage = (m.total_cost / totalCost * 100).toFixed(1);
      const inputRate = m.total_input_tokens > 0 ? (m.total_cost / m.total_input_tokens * 1000000).toFixed(2) : 'N/A';
      const outputRate = m.total_output_tokens > 0 ? (m.total_cost / m.total_output_tokens * 1000000).toFixed(2) : 'N/A';
      report += `| ${m.model} | $${m.total_cost.toFixed(2)} | ${percentage}% | $${inputRate} | $${outputRate} |\n`;
    });
    
    report += `\n### Cost Optimization Recommendations\n\n`;
    
    // Find most expensive model
    const mostExpensive = data.byModel.reduce((max, m) => 
      m.total_cost > (max?.total_cost || 0) ? m : max, null
    );
    
    if (mostExpensive) {
      report += `1. **Consider Model Optimization:** ${mostExpensive.model} accounts for ${(mostExpensive.total_cost / totalCost * 100).toFixed(1)}% of total costs.\n`;
      report += `   - Evaluate if a more cost-effective model could handle some requests\n`;
      report += `   - Consider caching frequent queries\n\n`;
    }
    
    // Check for high-cost projects
    const highCostProjects = data.byProject.filter(p => p.total_cost / totalCost > 0.3);
    if (highCostProjects.length > 0) {
      report += `2. **High-Cost Projects:** The following projects account for significant costs:\n`;
      highCostProjects.forEach(p => {
        report += `   - ${p.project_id || 'Default'}: $${p.total_cost.toFixed(2)} (${(p.total_cost / totalCost * 100).toFixed(1)}%)\n`;
      });
      report += `   - Review usage patterns and optimize prompts\n\n`;
    }
    
    return report;
  };

  const generatePerformanceReport = (data) => {
    let report = '## Performance Analysis Report\n\n';
    
    report += `### Response Time Percentiles\n\n`;
    report += '| Percentile | Average (ms) | Min (ms) | Max (ms) |\n';
    report += '|------------|--------------|----------|----------|\n';
    data.forEach(p => {
      report += `| P${p.percentile} | ${p.avg_value} | ${p.min_value} | ${p.max_value} |\n`;
    });
    
    report += `\n### Performance Insights\n\n`;
    
    const p95 = data.find(p => p.percentile === 95);
    const p50 = data.find(p => p.percentile === 50);
    
    if (p95 && p50) {
      report += `- **Median Response Time:** ${p50.avg_value}ms\n`;
      report += `- **95th Percentile:** ${p95.avg_value}ms\n`;
      report += `- **Performance Variability:** ${((p95.avg_value - p50.avg_value) / p50.avg_value * 100).toFixed(1)}%\n\n`;
      
      if (p95.avg_value > 3000) {
        report += `⚠️ **Warning:** 95th percentile response time exceeds 3 seconds. Consider:\n`;
        report += `- Optimizing prompt complexity\n`;
        report += `- Implementing request caching\n`;
        report += `- Using streaming responses for long operations\n`;
      }
    }
    
    return report;
  };

  const generateUsageReport = (data) => {
    let report = '## Usage Analysis Report\n\n';
    
    report += `### Recent API Calls\n\n`;
    report += '| Timestamp | Model | Tokens | Cost | Response Time | Status |\n';
    report += '|-----------|-------|--------|------|---------------|--------|\n';
    
    data.slice(0, 20).forEach(call => {
      const time = new Date(call.timestamp).toLocaleString();
      report += `| ${time} | ${call.model} | ${call.total_tokens} | $${call.cost.toFixed(4)} | ${call.response_time}ms | ${call.status} |\n`;
    });
    
    report += `\n### Usage Patterns\n\n`;
    
    // Group by hour
    const hourlyUsage = {};
    data.forEach(call => {
      const hour = new Date(call.timestamp).getHours();
      if (!hourlyUsage[hour]) {
        hourlyUsage[hour] = { count: 0, cost: 0 };
      }
      hourlyUsage[hour].count++;
      hourlyUsage[hour].cost += call.cost;
    });
    
    report += `#### Hourly Distribution\n\n`;
    report += '| Hour | Requests | Cost |\n';
    report += '|------|----------|------|\n';
    
    Object.entries(hourlyUsage).sort(([a], [b]) => parseInt(a) - parseInt(b)).forEach(([hour, data]) => {
      report += `| ${hour.padStart(2, '0')}:00 | ${data.count} | $${data.cost.toFixed(2)} |\n`;
    });
    
    return report;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report Generator</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Executive Summary</option>
              <option value="cost">Cost Analysis</option>
              <option value="performance">Performance Report</option>
              <option value="usage">Usage Details</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project ID (Optional)
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Filter by project"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Report Preview</h3>
            <button
              onClick={downloadReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
          
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
              {generateReportContent()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;