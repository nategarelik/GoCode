# 🚀 GoCode Tailscale Setup - Code On The Go!

## 🎯 Quick Start (You already have Tailscale!)

Since you have Tailscale set up, here's the optimal configuration for coding on the go:

### 1. Start GoCode on Your Main Machine

```bash
cd /home/ngarelik/claudecodeui
npm start
```

Your app is now running at `http://localhost:3008`

### 2. Access from Any Device via Tailscale

On your mobile device or any other computer:
```
http://[your-tailscale-machine-name]:3008
```

Example: `http://desktop-linux:3008` or `http://100.x.x.x:3008`

## 📱 Mobile Optimization

### iOS Shortcuts (One-Tap Access)

1. Open Safari on your iPhone/iPad
2. Navigate to `http://[your-tailscale-ip]:3008`
3. Tap Share → "Add to Home Screen"
4. Name it "GoCode"

### Android Setup

1. Open Chrome
2. Navigate to `http://[your-tailscale-ip]:3008`
3. Tap menu → "Install app" or "Add to Home screen"

## 🔧 Advanced Tailscale Configuration

### Enable HTTPS (Recommended)

1. **Get Tailscale HTTPS certificate**:
```bash
sudo tailscale cert $(tailscale status --json | jq -r .Self.DNSName | cut -d. -f1)
```

2. **Update server configuration**:
```bash
cat > .env.tailscale << EOF
# Tailscale HTTPS Configuration
HTTPS_ENABLED=true
SSL_CERT=/home/$(whoami)/.local/share/tailscale/certs/$(tailscale status --json | jq -r .Self.DNSName | cut -d. -f1).crt
SSL_KEY=/home/$(whoami)/.local/share/tailscale/certs/$(tailscale status --json | jq -r .Self.DNSName | cut -d. -f1).key
EOF
```

### Create Tailscale Service (Always Running)

```bash
# Create systemd service
sudo tee /etc/systemd/system/gocode.service > /dev/null << EOF
[Unit]
Description=GoCode Server
After=network.target tailscaled.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/home/$(whoami)/claudecodeui
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3008"

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable gocode
sudo systemctl start gocode
```

## 🚀 Performance Optimizations

### 1. Enable Compression
Add to your `.env`:
```
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6
```

### 2. Tailscale MagicDNS
Enable MagicDNS for easier access:
```bash
# Access via: http://gocode:3008 (if you name your machine 'gocode')
```

### 3. Mobile-Specific Optimizations
The app automatically detects mobile devices and:
- Reduces animation complexity
- Optimizes touch targets
- Enables aggressive caching
- Adjusts layout for smaller screens

## 📲 Quick Access URLs

Save these as bookmarks on all your devices:

### Primary Access Methods:
1. **Tailscale IP**: `http://100.x.x.x:3008`
2. **Tailscale Name**: `http://[machine-name]:3008`
3. **GitHub Pages** (Static Demo): `https://nategarelik.github.io/GoCode/`

## 🛡️ Security Best Practices

### 1. Tailscale ACLs
Limit access to your personal devices:
```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:personal"],
      "dst": ["*:3008"]
    }
  ]
}
```

### 2. Authentication
Enable authentication in `.env`:
```
AUTH_ENABLED=true
AUTH_SECRET=your-secure-secret-here
```

## 🎯 Mobile Coding Workflow

### Optimal Setup:
1. **Main Machine**: Run GoCode server with Tailscale
2. **iPad/Tablet**: Primary coding interface with keyboard
3. **Phone**: Quick edits and monitoring
4. **Laptop**: Full development when traveling

### Features Perfect for Mobile:
- ✅ Touch-optimized file tree
- ✅ Swipe gestures for navigation
- ✅ Voice-to-code (using device dictation)
- ✅ Responsive terminal that works with mobile keyboards
- ✅ Quick actions toolbar
- ✅ Offline support with service worker

## 🔍 Troubleshooting

### Can't Connect via Tailscale?

1. **Check Tailscale status**:
```bash
tailscale status
```

2. **Verify GoCode is running**:
```bash
sudo systemctl status gocode
# or
ps aux | grep "npm start"
```

3. **Check firewall**:
```bash
# Allow port 3008
sudo ufw allow from 100.64.0.0/10 to any port 3008
```

### Performance Issues?

1. **Enable production mode**:
```bash
NODE_ENV=production npm start
```

2. **Check Tailscale connection**:
```bash
tailscale ping [device-name]
```

3. **Reduce concurrent sessions**:
- Close unused browser tabs
- Limit to 2-3 active sessions

## 🚀 Pro Tips

1. **Pin to Dock/Taskbar**: Add the PWA to your device's home screen
2. **Keyboard Shortcuts**: Work on all devices (Cmd/Ctrl+S to save, etc.)
3. **Split Screen**: Use iPad split view for docs + coding
4. **External Monitor**: Connect your mobile device for bigger screen
5. **Bluetooth Keyboard**: Full productivity on the go

## 📱 Mobile Browser Shortcuts

### iOS Safari:
- `Cmd + L`: Focus address bar
- `Cmd + T`: New tab
- `Cmd + W`: Close tab
- `Cmd + Shift + ]`: Next tab

### Android Chrome:
- Swipe down: Refresh
- Long press back: History
- Three dots → Desktop site (if needed)

---

You're all set! With Tailscale + GoCode, you can code from anywhere with the same powerful interface. The low latency of Tailscale makes it feel like local development, even on mobile! 🎉