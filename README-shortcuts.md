# OpenClaudeUI Shortcuts Guide

This guide explains the various ways to start OpenClaudeUI quickly and easily.

## 🚀 Quick Start

### Linux/macOS

1. **Install shortcuts** (one-time setup):
   ```bash
   cd /home/ngarelik/claudecodeui
   ./install-shortcut.sh
   ```

2. **Run OpenClaudeUI**:
   - From anywhere: `claudeui`
   - From desktop: Look for "OpenClaudeUI" in applications menu
   - Direct: `./start-ui.sh`

### Windows

1. **Command Prompt**:
   ```cmd
   cd C:\path\to\claudecodeui
   start-ui.bat
   ```

2. **PowerShell**:
   ```powershell
   cd C:\path\to\claudecodeui
   .\start-ui.ps1
   ```

3. **Double-click**: Navigate to the folder and double-click `start-ui.bat`

## 📁 Available Scripts

### start-ui.sh (Linux/macOS)
Main startup script that:
- Checks for dependencies
- Verifies port availability
- Starts the server with helpful output
- Shows available features

### start-ui.bat (Windows Command Prompt)
Windows batch file that provides the same functionality as the shell script.

### start-ui.ps1 (Windows PowerShell)
PowerShell script with colored output and enhanced error checking.

### install-shortcut.sh (Linux/macOS)
Installation script that creates:
- Command line alias (`claudeui`)
- Desktop application shortcut
- Shell aliases in .bashrc/.zshrc

## 🛠️ Manual Setup

### Creating a Desktop Shortcut (Windows)

1. Right-click on desktop → New → Shortcut
2. Browse to `start-ui.bat`
3. Name it "OpenClaudeUI"
4. (Optional) Right-click → Properties → Change Icon

### Creating an Alias (Manual)

Add to your shell configuration file:

**Bash** (~/.bashrc):
```bash
alias claudeui='cd /home/ngarelik/claudecodeui && ./start-ui.sh'
```

**Zsh** (~/.zshrc):
```zsh
alias claudeui='cd /home/ngarelik/claudecodeui && ./start-ui.sh'
```

**PowerShell** ($PROFILE):
```powershell
function claudeui {
    Set-Location "C:\path\to\claudecodeui"
    .\start-ui.ps1
}
```

## 🔧 Troubleshooting

### Port Already in Use

If you see "Port 3456 is already in use":

**Linux/macOS**:
```bash
# Find the process
lsof -ti:3456

# Kill the process
lsof -ti:3456 | xargs kill
```

**Windows**:
```cmd
# Find the process
netstat -ano | findstr :3456

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Permission Denied

**Linux/macOS**:
```bash
chmod +x start-ui.sh
chmod +x install-shortcut.sh
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🎯 Features Available

Once started, OpenClaudeUI provides:

- **Chat Interface**: Interact with Claude AI
- **File Manager**: Browse and edit project files
- **Shell Access**: Integrated terminal
- **Git Integration**: Version control features
- **Analytics**: Project insights and metrics
- **Claude-Flow**: AI orchestration workflows

## 📍 Default URLs

- **Web Interface**: http://localhost:3456
- **WebSocket (Claude-Flow)**: ws://localhost:3456/claude-flow
- **API Endpoint**: http://localhost:3456/api

## 🔐 Security Note

The server runs locally on port 3456. It's not exposed to the internet by default. For remote access, consider using:
- SSH tunneling
- VPN connection
- Reverse proxy with authentication

## 💡 Tips

1. **Auto-start on boot** (Linux):
   ```bash
   # Add to crontab
   @reboot cd /home/ngarelik/claudecodeui && npm start
   ```

2. **Custom port**:
   Edit `server/config.js` to change the default port

3. **Background mode**:
   ```bash
   # Linux/macOS
   nohup ./start-ui.sh > claudeui.log 2>&1 &
   
   # Windows
   start /B start-ui.bat
   ```

4. **Development mode**:
   ```bash
   npm run dev  # Includes hot-reloading
   ```

## 📞 Support

If you encounter issues:
1. Check the console output for errors
2. Verify Node.js is installed: `node --version`
3. Ensure npm dependencies are installed
4. Check the logs in the terminal