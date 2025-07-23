#!/bin/bash

# OpenClaudeUI Startup Script
# This script starts the OpenClaudeUI server with claude-flow integration

echo "🚀 Starting OpenClaudeUI..."
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if the server is already running on port 3456
if lsof -Pi :3456 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3456 is already in use. OpenClaudeUI may already be running."
    echo "   To stop the existing process, run: lsof -ti:3456 | xargs kill"
    exit 1
fi

# Start the server
echo "🌐 Starting server on http://localhost:3456"
echo "📊 Claude-Flow integration enabled"
echo "🔄 WebSocket server running at ws://localhost:3456/claude-flow"
echo ""
echo "📝 Available features:"
echo "   - Chat with Claude"
echo "   - File management"
echo "   - Shell access"
echo "   - Git integration"
echo "   - Analytics dashboard"
echo "   - Claude-Flow orchestration"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

# Start the server
npm start