# 🚀 Quick Access Guide - GoCode

## 📍 Your Repository
- **GitHub**: https://github.com/nategarelik/GoCode
- **GitHub Pages**: https://nategarelik.github.io/GoCode/ (will be live after first workflow run)
- **Latest Release**: https://github.com/nategarelik/GoCode/releases/tag/v1.0.0

## 🖥️ Access From Any Device

### Option 1: Clone and Run Locally
```bash
# On any device with Git and Node.js
git clone https://github.com/nategarelik/GoCode.git
cd GoCode
npm install
npm start
# Access at http://localhost:3008
```

### Option 2: One-Line Install Script
```bash
# Run this on any Linux/Mac system
curl -fsSL https://raw.githubusercontent.com/nategarelik/GoCode/main/quick-start.sh | bash
```

### Option 3: Docker (No Node.js Required)
```bash
# If you have Docker installed
git clone https://github.com/nategarelik/GoCode.git
cd GoCode
docker-compose up
# Access at http://localhost:3008
```

## 📱 Mobile Access

### Install as App (PWA)
1. Visit http://localhost:3008 on your mobile device
2. iOS: Tap Share → Add to Home Screen
3. Android: Tap menu → Install App

### Remote Access Setup
```bash
# Option 1: Tailscale (Recommended)
cd GoCode
./setup-tailscale.sh

# Option 2: SSH Tunnel
ssh -L 3008:localhost:3008 your-server-ip

# Option 3: ngrok (temporary public URL)
ngrok http 3008
```

## 🔧 Common Commands

### Start/Stop
```bash
# Start
npm start

# Start in development mode
npm run dev

# Stop
Ctrl+C
```

### Update to Latest
```bash
git pull
npm install
npm run build
npm start
```

### Check Status
```bash
# View running processes
ps aux | grep node

# View logs
tail -f server.log

# Check port
lsof -i :3008
```

## 🌐 Deployment Options

### 1. Always-On Home Server
```bash
# Install as systemd service
sudo npm install -g pm2
pm2 start npm -- start
pm2 save
pm2 startup
```

### 2. Cloud Deployment
- **Heroku**: Use included Procfile
- **DigitalOcean**: Use App Platform
- **AWS/GCP**: Use included Kubernetes configs
- **Vercel/Netlify**: For static version only

### 3. Raspberry Pi
```bash
# Perfect for home network access
curl -fsSL https://raw.githubusercontent.com/nategarelik/GoCode/main/scripts/raspberry-pi-setup.sh | bash
```

## 🔒 Security Tips
1. Change default passwords in `.env`
2. Use HTTPS for public access
3. Enable firewall rules
4. Regular updates: `git pull && npm update`

## 📞 Quick Troubleshooting

### CSS Not Loading?
- Access via http://localhost:3008, not file://
- Clear browser cache
- Check console for errors

### Can't Access Remotely?
- Check firewall settings
- Verify port forwarding
- Try Tailscale for easy setup

### Performance Issues?
- Run `npm run build` for production mode
- Check available RAM
- Reduce concurrent sessions

## 🆘 Support
- Issues: https://github.com/nategarelik/GoCode/issues
- Docs: https://github.com/nategarelik/GoCode/tree/main/docs

---
Enjoy your AI coding assistant from anywhere! 🎉