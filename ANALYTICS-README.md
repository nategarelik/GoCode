# Claude Code UI Analytics & Monitoring System

## Overview

The Analytics & Monitoring System provides comprehensive tracking, monitoring, and reporting for Claude API usage. It includes real-time dashboards, cost tracking, performance monitoring, alerts, and detailed reporting capabilities.

## Features

### 1. Real-Time Dashboard
- **Usage Metrics**: Track API calls, token usage, and costs in real-time
- **Performance Metrics**: Monitor response times, error rates, and API latency
- **Cost Breakdown**: View costs by model, project, and time period
- **Visual Charts**: Interactive charts using Recharts for data visualization

### 2. Alert System
- **Cost Alerts**: Set thresholds for daily, weekly, monthly, or total spending
- **Performance Alerts**: Monitor response times, error rates, and token usage
- **Real-Time Notifications**: WebSocket-based alerts appear instantly in the UI
- **Alert Management**: Enable/disable alerts and configure thresholds

### 3. Reporting
- **Executive Summary**: High-level overview of usage and costs
- **Cost Analysis**: Detailed breakdown with optimization recommendations
- **Performance Reports**: Response time analysis and performance insights
- **Usage Details**: Granular API call logs with filtering options
- **Export Options**: Download reports in Markdown format

## Architecture

### Backend Components

#### Database Schema (`server/database/analytics.sql`)
- `usage_metrics`: Stores individual API call data
- `performance_metrics`: Tracks performance measurements
- `daily_metrics`: Aggregated daily statistics
- `cost_alerts`: Cost alert configurations
- `performance_alerts`: Performance alert configurations
- `model_pricing`: Claude model pricing information

#### Analytics Module (`server/database/analyticsDb.js`)
- Database operations and prepared statements
- Cost calculation based on model pricing
- Usage recording and performance tracking
- Alert checking and notification logic

#### Middleware (`server/middleware/analytics.js`)
- Automatic API usage tracking
- Performance measurement
- Integration with Claude CLI responses

#### API Routes (`server/routes/analytics.js`)
- RESTful endpoints for analytics data
- Alert management endpoints
- Reporting and summary endpoints

#### Alert Service (`server/services/alertService.js`)
- Background service checking alerts every 5 minutes
- WebSocket integration for real-time notifications
- Alert state management

### Frontend Components

#### Analytics Dashboard (`src/components/AnalyticsDashboard.jsx`)
- Interactive charts and metrics display
- Time range selection (24h, 7d, 30d, 90d)
- Multiple views: Overview, Costs, Performance, Usage

#### Alert Manager (`src/components/AlertsManager.jsx`)
- Create and manage cost/performance alerts
- Enable/disable alerts
- View alert history

#### Report Generator (`src/components/ReportGenerator.jsx`)
- Generate custom reports
- Multiple report types
- Date range and project filtering
- Markdown export

#### Alert Notifications (`src/components/AlertNotification.jsx`)
- Real-time alert popups
- Auto-dismiss with navigation option
- Alert grouping for multiple triggers

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install recharts
   ```

2. **Initialize Database**
   The analytics database will be created automatically when the server starts. The schema is defined in `server/database/analytics.sql`.

3. **Configure Model Pricing**
   Default pricing is included for Claude models. Update via the Analytics UI or API if needed.

4. **Access Analytics**
   Click the "Analytics" tab in the main UI navigation.

## Usage

### Viewing Analytics
1. Navigate to the Analytics tab
2. Select time range (24h, 7d, 30d, 90d)
3. Switch between Dashboard, Alerts, and Reports views

### Setting Up Alerts
1. Go to Analytics → Alerts
2. Click "New Alert"
3. Choose alert type (Cost or Performance)
4. Configure threshold and conditions
5. Save the alert

### Generating Reports
1. Go to Analytics → Reports
2. Select report type
3. Choose date range and filters
4. Click "Generate Report"
5. Download as Markdown

## Data Collection

The system automatically tracks:
- **Token Usage**: Input and output tokens per API call
- **Response Times**: API latency measurements
- **Error Rates**: Failed requests and error types
- **Model Usage**: Which Claude models are being used
- **Project Attribution**: Usage per project
- **Session Tracking**: Usage per Claude session

## Privacy & Security

- All analytics data is stored locally in SQLite
- No data is sent to external services
- User authentication required for access
- Sensitive information is never logged

## API Endpoints

### Analytics Data
- `GET /api/analytics/usage` - Usage metrics
- `GET /api/analytics/daily` - Daily aggregated data
- `GET /api/analytics/costs` - Cost breakdown
- `GET /api/analytics/performance/:metricType` - Performance data
- `GET /api/analytics/errors` - Error rate data
- `GET /api/analytics/summary` - Summary statistics

### Alert Management
- `GET /api/analytics/alerts` - List alerts
- `POST /api/analytics/alerts/cost` - Create cost alert
- `POST /api/analytics/alerts/performance` - Create performance alert
- `PATCH /api/analytics/alerts/:type/:id` - Toggle alert
- `DELETE /api/analytics/alerts/:type/:id` - Delete alert
- `GET /api/analytics/alerts/check` - Check for triggered alerts

### Model Pricing
- `GET /api/analytics/pricing` - Get model pricing
- `POST /api/analytics/pricing` - Update model pricing

## Troubleshooting

### No Data Showing
- Ensure Claude CLI is being used through the UI
- Check that the analytics middleware is active
- Verify database file exists at `server/database/analytics.db`

### Alerts Not Triggering
- Verify alert service is running (check server logs)
- Ensure WebSocket connection is active
- Check alert thresholds and conditions

### Performance Issues
- Analytics data is automatically indexed
- Consider archiving old data if database grows large
- Adjust alert check frequency if needed

## Future Enhancements

Potential improvements:
- Data export to CSV/Excel
- Budget forecasting
- Usage trends and predictions
- Team/user attribution
- API rate limit monitoring
- Custom alert conditions
- Scheduled report emails
- Integration with external monitoring tools