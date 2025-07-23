# OpenClaudeUI Startup Script for PowerShell

Write-Host "🚀 Starting OpenClaudeUI..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if port 3456 is in use
$tcpConnections = Get-NetTCPConnection -LocalPort 3456 -State Listen -ErrorAction SilentlyContinue
if ($tcpConnections) {
    Write-Host "⚠️  Port 3456 is already in use. OpenClaudeUI may already be running." -ForegroundColor Red
    Write-Host "   To stop the existing process, close the other instance first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the server
Write-Host "`n🌐 Starting server on http://localhost:3456" -ForegroundColor Green
Write-Host "📊 Claude-Flow integration enabled" -ForegroundColor Green
Write-Host "🔄 WebSocket server running at ws://localhost:3456/claude-flow" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Available features:" -ForegroundColor Cyan
Write-Host "   - Chat with Claude"
Write-Host "   - File management"
Write-Host "   - Shell access"
Write-Host "   - Git integration"
Write-Host "   - Analytics dashboard"
Write-Host "   - Claude-Flow orchestration"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Gray
Write-Host ""

# Start the server
npm start