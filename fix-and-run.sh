#!/bin/bash

echo "🔧 Claude Code UI - Complete Fix & Run"
echo "====================================="
echo ""

# Ensure we're in the right directory
cd /home/ngarelik/claudecodeui

# Load NVM and use Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

echo "Using Node $(node -v)"

# Clean everything
echo "Cleaning old installations..."
rm -rf node_modules package-lock.json

# Install fresh
echo "Installing dependencies..."
npm install

# Start with proper environment
echo ""
echo "Starting Claude Code UI..."
echo "Local: http://localhost:3009"
echo "Mobile: http://$(hostname -I | awk '{print $1}'):3009"
echo ""

# Run the dev server
npm run dev