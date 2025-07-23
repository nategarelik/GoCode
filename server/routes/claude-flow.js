import express from 'express';
import { exec, spawn } from 'child_process';
import path from 'path';
import { WebSocketServer } from 'ws';

// Store active claude-flow processes
const activeFlows = new Map();
const router = express.Router();

// WebSocket server for real-time updates
let wss;

function setupWebSocketServer(server) {
  wss = new WebSocketServer({ 
    server,
    path: '/claude-flow'
  });

  wss.on('connection', (ws) => {
    console.log('Claude-Flow WebSocket client connected');
    
    ws.on('close', () => {
      console.log('Claude-Flow WebSocket client disconnected');
    });
  });
}

// Broadcast message to all connected clients
function broadcast(data) {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
}

// Start a new Claude-Flow workflow
router.post('/start', async (req, res) => {
  try {
    const { objective, mode, projectPath, options } = req.body;
    const taskId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate starting the workflow
    const flowProcess = {
      id: taskId,
      objective,
      mode,
      projectPath,
      options,
      status: 'running',
      agents: [],
      tasks: [],
      startTime: new Date()
    };
    
    activeFlows.set(taskId, flowProcess);
    
    // Initial log
    broadcast({
      type: 'log',
      level: 'info',
      message: `Starting ${mode} mode workflow: ${objective}`
    });
    
    // Simulate agent spawning
    setTimeout(() => {
      const agents = generateAgents(mode, objective);
      flowProcess.agents = agents;
      
      broadcast({
        type: 'log',
        level: 'info',
        message: `Spawning ${agents.length} agents for ${mode} mode operation`
      });
      
      agents.forEach((agent, index) => {
        setTimeout(() => {
          broadcast({
            type: 'agent-spawned',
            agent
          });
        }, index * 200);
      });
    }, 1000);
    
    // Simulate task creation
    setTimeout(() => {
      const tasks = generateTasks(objective, flowProcess.agents);
      flowProcess.tasks = tasks;
      
      broadcast({
        type: 'log',
        level: 'info',
        message: `Created ${tasks.length} tasks for execution`
      });
      
      tasks.forEach((task, index) => {
        setTimeout(() => {
          broadcast({
            type: 'task-started',
            taskId: task.id
          });
        }, index * 300);
      });
    }, 3000);
    
    // Simulate resource updates
    const resourceInterval = setInterval(() => {
      if (flowProcess.status !== 'running') {
        clearInterval(resourceInterval);
        return;
      }
      
      broadcast({
        type: 'resource-update',
        resources: {
          memory: Math.floor(Math.random() * 500) + 100,
          cpu: Math.floor(Math.random() * 80) + 10,
          activeAgents: flowProcess.agents.filter(a => a.status === 'active').length,
          completedTasks: flowProcess.tasks.filter(t => t.status === 'completed').length
        }
      });
    }, 3000);
    
    res.json({ taskId, status: 'started' });
  } catch (error) {
    console.error('Failed to start Claude-Flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause a workflow
router.post('/pause/:taskId', (req, res) => {
  const { taskId } = req.params;
  const flow = activeFlows.get(taskId);
  
  if (!flow) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  flow.status = 'paused';
  broadcast({
    type: 'log',
    level: 'info',
    message: `Workflow ${taskId} paused`
  });
  
  res.json({ status: 'paused' });
});

// Resume a workflow
router.post('/resume/:taskId', (req, res) => {
  const { taskId } = req.params;
  const flow = activeFlows.get(taskId);
  
  if (!flow) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  flow.status = 'running';
  broadcast({
    type: 'log',
    level: 'info',
    message: `Workflow ${taskId} resumed`
  });
  
  res.json({ status: 'resumed' });
});

// Stop a workflow
router.post('/stop/:taskId', (req, res) => {
  const { taskId } = req.params;
  const flow = activeFlows.get(taskId);
  
  if (!flow) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  flow.status = 'stopped';
  activeFlows.delete(taskId);
  
  broadcast({
    type: 'log',
    level: 'info',
    message: `Workflow ${taskId} stopped`
  });
  
  res.json({ status: 'stopped' });
});

// Get workflow status
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const flow = activeFlows.get(taskId);
  
  if (!flow) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(flow);
});

// Helper functions
function generateAgents(mode, objective) {
  const agents = [];
  const agentTypes = mode === 'simple' ? ['developer'] : 
                    mode === 'team' ? ['coordinator', 'developer', 'analyst', 'tester'] :
                    ['coordinator', 'developer', 'analyst', 'researcher', 'tester'];
  
  agentTypes.forEach((type, index) => {
    agents.push({
      id: `agent-${Date.now()}-${index}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent ${index + 1}`,
      type,
      status: 'active',
      capabilities: getAgentCapabilities(type)
    });
  });
  
  return agents;
}

function generateTasks(objective, agents) {
  const tasks = [
    { id: 'task-1', name: 'Analyze requirements', status: 'running', assignedTo: agents[0]?.id },
    { id: 'task-2', name: 'Design architecture', status: 'pending', assignedTo: agents[1]?.id },
    { id: 'task-3', name: 'Implement core functionality', status: 'pending', assignedTo: agents[1]?.id },
    { id: 'task-4', name: 'Write tests', status: 'pending', assignedTo: agents[3]?.id },
    { id: 'task-5', name: 'Document implementation', status: 'pending', assignedTo: agents[2]?.id }
  ];
  
  // Simulate task completion
  tasks.forEach((task, index) => {
    setTimeout(() => {
      task.status = 'completed';
      broadcast({
        type: 'task-completed',
        taskId: task.id,
        result: { success: true }
      });
    }, (index + 1) * 5000);
  });
  
  return tasks;
}

function getAgentCapabilities(type) {
  const capabilities = {
    coordinator: ['task-management', 'delegation', 'monitoring'],
    developer: ['coding', 'debugging', 'testing'],
    analyst: ['data-analysis', 'pattern-recognition', 'reporting'],
    researcher: ['information-gathering', 'documentation', 'validation'],
    tester: ['testing', 'quality-assurance', 'validation']
  };
  
  return capabilities[type] || [];
}

export { router, setupWebSocketServer };