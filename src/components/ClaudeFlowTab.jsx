import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Sparkles, Play, Pause, Square, Users, Brain, Zap, 
  BarChart3, AlertCircle, CheckCircle2, Clock, 
  Settings, RefreshCw, ChevronRight, Activity,
  GitBranch, Target, Layers, Network, Workflow,
  CircleDot, ArrowRight, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../utils/api';

// Mode configurations
const CLAUDE_FLOW_MODES = {
  simple: {
    name: 'Simple',
    icon: Zap,
    description: 'Single agent, quick tasks',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    maxAgents: 1,
    timeout: 5 * 60 * 1000 // 5 minutes
  },
  team: {
    name: 'Team',
    icon: Users,
    description: 'Small team of specialized agents',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    maxAgents: 5,
    timeout: 30 * 60 * 1000 // 30 minutes
  },
  enterprise: {
    name: 'Enterprise',
    icon: Brain,
    description: 'Full orchestration with resource management',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    maxAgents: 20,
    timeout: 2 * 60 * 60 * 1000 // 2 hours
  }
};

// Agent type configurations
const AGENT_TYPES = {
  coordinator: { name: 'Coordinator', icon: GitBranch, color: 'text-indigo-500' },
  developer: { name: 'Developer', icon: Target, color: 'text-green-500' },
  analyst: { name: 'Analyst', icon: BarChart3, color: 'text-blue-500' },
  researcher: { name: 'Researcher', icon: Brain, color: 'text-purple-500' },
  tester: { name: 'Tester', icon: CheckCircle2, color: 'text-yellow-500' }
};

function ClaudeFlowTab({ projectPath }) {
  const [mode, setMode] = useState('simple');
  const [objective, setObjective] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [resourceUsage, setResourceUsage] = useState({
    memory: 0,
    cpu: 0,
    activeAgents: 0,
    completedTasks: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [maxAgents, setMaxAgents] = useState(CLAUDE_FLOW_MODES.team.maxAgents);
  const [enableParallel, setEnableParallel] = useState(true);
  const [enableMemory, setEnableMemory] = useState(true);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3456/claude-flow`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'agent-spawned':
          setAgents(prev => [...prev, data.agent]);
          setLogs(prev => [...prev, { 
            timestamp: new Date(), 
            level: 'info',
            message: `Agent spawned: ${data.agent.name}`
          }]);
          break;
        case 'task-started':
          setTasks(prev => prev.map(t => 
            t.id === data.taskId ? { ...t, status: 'running' } : t
          ));
          const task = tasks.find(t => t.id === data.taskId);
          if (task) {
            setLogs(prev => [...prev, { 
              timestamp: new Date(), 
              level: 'info',
              message: `Task started: ${task.name}`
            }]);
          }
          break;
        case 'task-completed':
          setTasks(prev => prev.map(t => 
            t.id === data.taskId ? { ...t, status: 'completed', result: data.result } : t
          ));
          const completedTask = tasks.find(t => t.id === data.taskId);
          if (completedTask) {
            setLogs(prev => [...prev, { 
              timestamp: new Date(), 
              level: 'success',
              message: `Task completed: ${completedTask.name}`
            }]);
          }
          break;
        case 'resource-update':
          setResourceUsage(data.resources);
          break;
        case 'log':
          setLogs(prev => [...prev, { 
            timestamp: new Date(), 
            level: data.level || 'info',
            message: data.message 
          }]);
          break;
      }
    };

    return () => ws.close();
  }, []);

  const detectMode = useCallback((taskDescription) => {
    if (!autoDetectMode) return mode;
    
    const complexityScore = analyzeComplexity(taskDescription);
    
    if (complexityScore < 0.3) return 'simple';
    if (complexityScore < 0.7) return 'team';
    return 'enterprise';
  }, [autoDetectMode, mode]);

  const analyzeComplexity = (task) => {
    let score = 0;
    
    // Length factor
    if (task.length > 200) score += 0.2;
    
    // Complex keywords
    const complexKeywords = ['system', 'migrate', 'refactor', 'architecture', 'enterprise'];
    const teamKeywords = ['api', 'frontend', 'backend', 'database', 'integration'];
    
    complexKeywords.forEach(keyword => {
      if (task.toLowerCase().includes(keyword)) score += 0.15;
    });
    
    teamKeywords.forEach(keyword => {
      if (task.toLowerCase().includes(keyword)) score += 0.1;
    });
    
    return Math.min(1, score);
  };

  const startWorkflow = async () => {
    if (!objective.trim()) return;
    
    const selectedMode = detectMode(objective);
    setMode(selectedMode);
    setIsRunning(true);
    setIsPaused(false);
    setLogs([]);
    setTasks([]);
    setAgents([]);
    
    try {
      const response = await api.post('/claude-flow/start', {
        objective,
        mode: selectedMode,
        projectPath,
        options: {
          maxAgents: CLAUDE_FLOW_MODES[selectedMode].maxAgents,
          parallel: enableParallel,
          memory: enableMemory,
          timeout: CLAUDE_FLOW_MODES[selectedMode].timeout
        }
      });
      
      setCurrentTask({ 
        id: response.data.taskId,
        startTime: Date.now()
      });
    } catch (error) {
      console.error('Failed to start workflow:', error);
      setIsRunning(false);
    }
  };

  const pauseWorkflow = async () => {
    if (!currentTask) return;
    
    try {
      await api.post(`/claude-flow/pause/${currentTask.id}`);
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause workflow:', error);
    }
  };

  const resumeWorkflow = async () => {
    if (!currentTask) return;
    
    try {
      await api.post(`/claude-flow/resume/${currentTask.id}`);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume workflow:', error);
    }
  };

  const stopWorkflow = async () => {
    if (!currentTask) return;
    
    try {
      await api.post(`/claude-flow/stop/${currentTask.id}`);
      setIsRunning(false);
      setIsPaused(false);
      setCurrentTask(null);
    } catch (error) {
      console.error('Failed to stop workflow:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Claude-Flow Orchestration</h2>
            <Badge variant="outline" className="ml-2">
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Objective Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Describe your objective..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isRunning && startWorkflow()}
            disabled={isRunning}
            className="flex-1"
          />
          {!isRunning ? (
            <Button onClick={startWorkflow} disabled={!objective.trim()}>
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          ) : (
            <div className="flex gap-1">
              {!isPaused ? (
                <Button onClick={pauseWorkflow} variant="outline" size="sm">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={resumeWorkflow} variant="outline" size="sm">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={stopWorkflow} variant="destructive" size="sm">
                <Square className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-detect Mode</label>
              <input
                type="checkbox"
                checked={autoDetectMode}
                onChange={(e) => setAutoDetectMode(e.target.checked)}
                className="rounded"
              />
            </div>
            {!autoDetectMode && (
              <div className="flex gap-2">
                {Object.entries(CLAUDE_FLOW_MODES).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={key}
                      variant={mode === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode(key)}
                      className={cn(mode === key && config.bgColor)}
                    >
                      <Icon className={cn('w-4 h-4 mr-1', config.color)} />
                      {config.name}
                    </Button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Parallel Execution</label>
              <input
                type="checkbox"
                checked={enableParallel}
                onChange={(e) => setEnableParallel(e.target.checked)}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Memory System</label>
              <input
                type="checkbox"
                checked={enableMemory}
                onChange={(e) => setEnableMemory(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Workflow Visualization */}
        {isRunning && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Network className="w-4 h-4" />
              Workflow Visualization
            </h3>
            <div className="flex items-center justify-between">
              {/* Mode Indicator */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  CLAUDE_FLOW_MODES[mode].bgColor
                )}>
                  {React.createElement(CLAUDE_FLOW_MODES[mode].icon, {
                    className: cn("w-5 h-5", CLAUDE_FLOW_MODES[mode].color)
                  })}
                </div>
                <div>
                  <div className="font-medium">{CLAUDE_FLOW_MODES[mode].name} Mode</div>
                  <div className="text-xs text-gray-500">{CLAUDE_FLOW_MODES[mode].description}</div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-6">
                {['Analyzing', 'Planning', 'Executing', 'Completing'].map((stage, index) => (
                  <div key={stage} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tasks.filter(t => t.status === 'completed').length > index * 2
                          ? "bg-green-500 text-white"
                          : tasks.filter(t => t.status === 'running').length > 0 && index === Math.floor(tasks.length / 4)
                          ? "bg-blue-500 text-white animate-pulse"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      )}>
                        {tasks.filter(t => t.status === 'completed').length > index * 2 ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : tasks.filter(t => t.status === 'running').length > 0 && index === Math.floor(tasks.length / 4) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CircleDot className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs mt-1">{stage}</span>
                    </div>
                    {index < 3 && (
                      <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>

              {/* Time Elapsed */}
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Elapsed</div>
                <div className="font-mono text-lg">
                  {currentTask && (() => {
                    const elapsed = Date.now() - (currentTask.startTime || Date.now());
                    const minutes = Math.floor(elapsed / 60000);
                    const seconds = Math.floor((elapsed % 60000) / 1000);
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Left Panel - Agents and Tasks */}
          <div className="space-y-4">
          {/* Active Agents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Agents ({agents.length})
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {agents.map((agent) => {
                  const agentType = AGENT_TYPES[agent.type] || {};
                  const Icon = agentType.icon || Activity;
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all",
                        agent.status === 'active' && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
                        agent.status === 'idle' && "bg-gray-50 dark:bg-gray-700/50",
                        agent.status === 'completed' && "bg-green-50 dark:bg-green-900/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          agent.status === 'active' && "bg-blue-100 dark:bg-blue-800",
                          agent.status === 'idle' && "bg-gray-100 dark:bg-gray-700",
                          agent.status === 'completed' && "bg-green-100 dark:bg-green-800"
                        )}>
                          <Icon className={cn('w-4 h-4', agentType.color)} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{agent.name}</span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {agent.capabilities?.join(' • ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.status === 'active' && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                        <Badge 
                          variant={
                            agent.status === 'active' ? 'default' :
                            agent.status === 'completed' ? 'success' :
                            'outline'
                          } 
                          className="text-xs"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tasks ({tasks.filter(t => t.status === 'completed').length}/{tasks.length})
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={cn(
                      "relative p-3 rounded-lg transition-all",
                      task.status === 'running' && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
                      task.status === 'completed' && "bg-green-50 dark:bg-green-900/20",
                      task.status === 'pending' && "bg-gray-50 dark:bg-gray-700/50",
                      task.status === 'failed' && "bg-red-50 dark:bg-red-900/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-medium">{task.name}</span>
                        </div>
                        {task.assignedTo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Assigned to: {agents.find(a => a.id === task.assignedTo)?.name || 'Unknown'}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'running' && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                        {task.status === 'completed' && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        {task.status === 'failed' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <Badge
                          variant={
                            task.status === 'completed' ? 'success' :
                            task.status === 'running' ? 'default' :
                            task.status === 'failed' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    {/* Progress bar for running tasks */}
                    {task.status === 'running' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel - Resource Usage and Logs */}
        <div className="space-y-4">
          {/* Resource Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Resource Usage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
                <div className="text-2xl font-semibold">{resourceUsage.memory}MB</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(resourceUsage.memory / 1024) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CPU</div>
                <div className="text-2xl font-semibold">{resourceUsage.cpu}%</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${resourceUsage.cpu}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Agents</div>
                <div className="text-2xl font-semibold">{resourceUsage.activeAgents}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed Tasks</div>
                <div className="text-2xl font-semibold">{resourceUsage.completedTasks}</div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity Log
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-1.5 text-xs font-mono">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No activity yet. Start a workflow to see logs.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex gap-2 p-1.5 rounded',
                        log.level === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                        log.level === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                        log.level === 'success' && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
                        log.level === 'info' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      )}
                    >
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default ClaudeFlowTab;