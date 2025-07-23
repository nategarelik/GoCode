# Claude-Flow Integration in OpenClaudeUI

This document describes the Claude-Flow integration in OpenClaudeUI, providing a powerful visual interface for AI orchestration workflows.

## Overview

The Claude-Flow tab in OpenClaudeUI provides real-time monitoring and control of AI-driven workflows, allowing users to:

- Start, pause, resume, and stop workflows
- Monitor agent activity and task progress
- Track resource usage (CPU, memory)
- View real-time activity logs
- Visualize workflow progression

## Features

### 1. Workflow Modes

Claude-Flow supports three operational modes:

- **Simple Mode** (Green): Single agent for quick tasks (5 min timeout)
- **Team Mode** (Blue): Small team of specialized agents (30 min timeout)
- **Enterprise Mode** (Purple): Full orchestration with up to 20 agents (2 hour timeout)

### 2. Workflow Visualization

The interface includes:

- **Progress Stages**: Visual representation of workflow stages (Analyzing → Planning → Executing → Completing)
- **Real-time Updates**: Live status updates via WebSocket
- **Time Tracking**: Elapsed time display for performance monitoring

### 3. Agent Management

- **Visual Agent Cards**: Color-coded status indicators (active/idle/completed)
- **Agent Capabilities**: Display of each agent's specialized skills
- **Real-time Status**: Animated indicators for active agents

### 4. Task Tracking

- **Task Progress**: Visual progress bars for running tasks
- **Task Assignment**: Shows which agent is handling each task
- **Status Indicators**: Color-coded task cards (pending/running/completed/failed)

### 5. Resource Monitoring

- **CPU Usage**: Real-time CPU utilization with visual gauge
- **Memory Usage**: Memory consumption tracking
- **Agent Count**: Active agent monitoring
- **Task Statistics**: Completed task counter

### 6. Activity Logs

- **Color-coded Logs**: Different colors for info/success/warning/error
- **Timestamps**: Precise timing for each log entry
- **Clear Function**: Ability to clear logs
- **Auto-scroll**: Automatic scrolling for new entries

## Usage

### Starting a Workflow

1. Navigate to the "Flow" tab in OpenClaudeUI
2. Enter your objective in the input field
3. (Optional) Configure settings:
   - Auto-detect mode (recommended)
   - Enable/disable parallel execution
   - Enable/disable memory system
4. Click "Start" or press Enter

### Mode Selection

- **Auto-detect** (Default): Claude-Flow analyzes your objective and selects the appropriate mode
- **Manual**: Click the settings icon and disable auto-detect to manually choose a mode

### Workflow Control

- **Pause**: Temporarily halt workflow execution
- **Resume**: Continue a paused workflow
- **Stop**: Terminate the workflow completely

## Architecture

### Frontend Components

- **ClaudeFlowTab.jsx**: Main React component for the UI
- **WebSocket Integration**: Real-time updates from the server
- **Responsive Design**: Works on desktop and mobile devices

### Backend API

- **POST /api/claude-flow/start**: Start a new workflow
- **POST /api/claude-flow/pause/:id**: Pause a workflow
- **POST /api/claude-flow/resume/:id**: Resume a workflow
- **POST /api/claude-flow/stop/:id**: Stop a workflow
- **GET /api/claude-flow/status/:id**: Get workflow status

### WebSocket Events

- **agent-spawned**: New agent created
- **task-started**: Task execution began
- **task-completed**: Task finished
- **resource-update**: Resource usage update
- **log**: Activity log entry

## Testing

Run the integration test:

```bash
cd ~/claudecodeui
node test-claude-flow-integration.js
```

This will verify:
- WebSocket connectivity
- API endpoint functionality
- Real-time update mechanism

## Troubleshooting

### WebSocket Connection Issues

If WebSocket fails to connect:
1. Ensure the server is running on port 3456
2. Check firewall settings
3. Verify WebSocket path: `/claude-flow`

### API Errors

Common issues:
- **404 Not Found**: Check API route registration
- **500 Internal Error**: Review server logs
- **CORS Issues**: Ensure proper CORS configuration

### Performance

For optimal performance:
- Limit concurrent workflows
- Monitor resource usage
- Use appropriate mode for task complexity

## Future Enhancements

Planned improvements:
1. Workflow templates
2. Historical workflow analytics
3. Multi-user collaboration
4. Export/import workflows
5. Custom agent configurations

## Support

For issues or questions:
1. Check the activity logs for error messages
2. Review the browser console for client-side errors
3. Examine server logs for backend issues
4. File issues in the project repository