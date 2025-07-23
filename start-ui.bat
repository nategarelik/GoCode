@echo off
REM OpenClaudeUI Startup Script for Windows

echo Starting OpenClaudeUI...
echo ================================

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Check if port 3456 is in use
netstat -an | findstr :3456 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 3456 is already in use. OpenClaudeUI may already be running.
    echo To stop the existing process, close the other instance first.
    pause
    exit /b 1
)

REM Start the server
echo.
echo Starting server on http://localhost:3456
echo Claude-Flow integration enabled
echo WebSocket server running at ws://localhost:3456/claude-flow
echo.
echo Available features:
echo   - Chat with Claude
echo   - File management  
echo   - Shell access
echo   - Git integration
echo   - Analytics dashboard
echo   - Claude-Flow orchestration
echo.
echo Press Ctrl+C to stop the server
echo ================================
echo.

REM Start the server
call npm start