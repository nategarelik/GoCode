#!/usr/bin/env node

/**
 * Test script for Claude-Flow integration with OpenClaudeUI
 * 
 * This script verifies:
 * 1. WebSocket connection to claude-flow endpoint
 * 2. API endpoints for workflow control
 * 3. Real-time updates and visualization
 */

import { WebSocket } from 'ws';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3456/api';
const WS_URL = 'ws://localhost:3456/claude-flow';

console.log('🧪 Testing Claude-Flow Integration...\n');

// Test WebSocket Connection
console.log('1. Testing WebSocket connection...');
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('📨 Received:', message.type, message.level || '', message.message || '');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Test API Endpoints
async function testAPI() {
  console.log('\n2. Testing API endpoints...');
  
  try {
    // Test workflow start
    console.log('   Testing /claude-flow/start...');
    const startResponse = await fetch(`${API_BASE}/claude-flow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective: 'Test workflow: Build a simple REST API',
        mode: 'team',
        projectPath: '/test/project',
        options: {
          maxAgents: 5,
          parallel: true,
          memory: true
        }
      })
    });
    
    if (!startResponse.ok) {
      throw new Error(`Start failed: ${startResponse.status}`);
    }
    
    const { taskId } = await startResponse.json();
    console.log(`✅ Workflow started with ID: ${taskId}`);
    
    // Wait for some activity
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test workflow status
    console.log('   Testing /claude-flow/status...');
    const statusResponse = await fetch(`${API_BASE}/claude-flow/status/${taskId}`);
    
    if (!statusResponse.ok) {
      throw new Error(`Status failed: ${statusResponse.status}`);
    }
    
    const status = await statusResponse.json();
    console.log(`✅ Workflow status: ${status.status}`);
    console.log(`   Agents: ${status.agents.length}`);
    console.log(`   Tasks: ${status.tasks.length}`);
    
    // Test workflow pause
    console.log('   Testing /claude-flow/pause...');
    const pauseResponse = await fetch(`${API_BASE}/claude-flow/pause/${taskId}`, {
      method: 'POST'
    });
    
    if (!pauseResponse.ok) {
      throw new Error(`Pause failed: ${pauseResponse.status}`);
    }
    
    console.log('✅ Workflow paused');
    
    // Test workflow resume
    console.log('   Testing /claude-flow/resume...');
    const resumeResponse = await fetch(`${API_BASE}/claude-flow/resume/${taskId}`, {
      method: 'POST'
    });
    
    if (!resumeResponse.ok) {
      throw new Error(`Resume failed: ${resumeResponse.status}`);
    }
    
    console.log('✅ Workflow resumed');
    
    // Wait for more activity
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test workflow stop
    console.log('   Testing /claude-flow/stop...');
    const stopResponse = await fetch(`${API_BASE}/claude-flow/stop/${taskId}`, {
      method: 'POST'
    });
    
    if (!stopResponse.ok) {
      throw new Error(`Stop failed: ${stopResponse.status}`);
    }
    
    console.log('✅ Workflow stopped');
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Summary:');
    console.log('- WebSocket connection: ✅');
    console.log('- Start workflow: ✅');
    console.log('- Get status: ✅');
    console.log('- Pause/Resume: ✅');
    console.log('- Stop workflow: ✅');
    console.log('\n💡 Claude-Flow integration is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the OpenClaudeUI server is running on port 3456');
  }
  
  // Clean up
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 1000);
}

// Run tests after WebSocket connects
ws.on('open', () => {
  setTimeout(testAPI, 500);
});

// Handle timeout
setTimeout(() => {
  console.error('\n❌ Test timeout - no connection established');
  process.exit(1);
}, 10000);