# Claude Code UI - Mobile Access Deployment Guide

This comprehensive guide covers setting up Claude Code UI for secure mobile access, with specific optimizations for iOS devices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Remote Access Configuration](#remote-access-configuration)
4. [iOS-Specific Setup](#ios-specific-setup)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Performance Optimization](#performance-optimization)

## Prerequisites

### System Requirements
- **Node.js**: v20.x or higher (required)
- **npm**: v8.x or higher
- **Claude Code CLI**: Installed and configured
- **Operating System**: Linux, macOS, or Windows with WSL2

### Hardware Requirements
- **Server/Computer**: 
  - Minimum 2GB RAM
  - 1GB free disk space
  - Stable internet connection
- **Mobile Device**: 
  - iOS 14+ (iPhone/iPad)
  - Safari browser (for PWA support)

## Local Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/siteboon/claudecodeui.git
cd claudecodeui

# Install Node.js v20 if not already installed
# Using nvm (recommended):
nvm install 20
nvm use 20

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Add these mobile-specific configurations to your `.env`:

```env
# Server Configuration
PORT=3008
VITE_PORT=3009

# Mobile Access Configuration
VITE_HOST=0.0.0.0  # Allow connections from any IP

# Optional: HTTPS Configuration (recommended for production)
# VITE_HTTPS=true
# VITE_SSL_CERT=/path/to/cert.pem
# VITE_SSL_KEY=/path/to/key.pem
```

### 3. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 4. Verify Local Access

Open your browser and navigate to:
- Frontend: `http://localhost:3009`
- API: `http://localhost:3008`

## Remote Access Configuration

### Option 1: Direct Network Access (Simple)

#### A. Find Your Local IP

```bash
# Linux/Mac
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr /i "ipv4"
```

#### B. Configure Firewall

```bash
# Run the setup script
chmod +x setup-remote-access.sh
./setup-remote-access.sh

# Or manually configure firewall:

# UFW (Ubuntu/Debian)
sudo ufw allow 3008/tcp
sudo ufw allow 3009/tcp

# firewalld (RHEL/CentOS)
sudo firewall-cmd --permanent --add-port=3008/tcp
sudo firewall-cmd --permanent --add-port=3009/tcp
sudo firewall-cmd --reload
```

#### C. Access from Mobile

On your iOS device, open Safari and navigate to:
```
http://YOUR_LOCAL_IP:3009
```

### Option 2: Secure HTTPS with Self-Signed Certificate

#### A. Generate SSL Certificate

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:YOUR_LOCAL_IP"
```

#### B. Update Environment Configuration

Edit `.env`:
```env
VITE_HTTPS=true
VITE_SSL_CERT=./ssl/cert.pem
VITE_SSL_KEY=./ssl/key.pem
```

#### C. Trust Certificate on iOS

1. Email the `cert.pem` file to yourself
2. Open the email on your iOS device
3. Tap the certificate attachment
4. Go to Settings > General > Profiles & Device Management
5. Install the certificate
6. Go to Settings > General > About > Certificate Trust Settings
7. Enable full trust for the certificate

### Option 3: Reverse Proxy with Nginx (Production)

#### A. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# RHEL/CentOS
sudo yum install nginx
```

#### B. Configure Nginx

Create `/etc/nginx/sites-available/claudecodeui`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### C. Enable and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/claudecodeui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 4: Tunnel Services (Easiest for Testing)

#### Using ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose the frontend
ngrok http 3009
```

#### Using Cloudflare Tunnel

```bash
# Install cloudflared
# See: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create tunnel
cloudflared tunnel create claude-ui
cloudflared tunnel route dns claude-ui your-subdomain.your-domain.com
cloudflared tunnel run claude-ui
```

## iOS-Specific Setup

### 1. Add to Home Screen (PWA)

1. Open Safari on your iPhone/iPad
2. Navigate to your Claude Code UI URL
3. Tap the Share button (square with up arrow)
4. Scroll down and tap "Add to Home Screen"
5. Name it "Claude Code" and tap "Add"

### 2. iOS Safari Settings

Ensure optimal performance:
1. Go to Settings > Safari
2. Disable "Prevent Cross-Site Tracking" for local network access
3. Enable JavaScript (Advanced > JavaScript)
4. Clear History and Website Data if experiencing issues

### 3. Import iOS Enhancements

Add to your main application file:

```javascript
// In src/main.jsx or App.jsx
import { initializeIOSEnhancements } from '../ios-enhancements.js';

// Initialize on app load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIOSEnhancements);
} else {
    initializeIOSEnhancements();
}
```

### 4. Enable iOS-Specific Features

The iOS enhancements script provides:
- Dynamic viewport height fixes
- Safe area handling for notched devices
- Keyboard detection and adjustment
- Touch target optimization (44x44px minimum)
- Bounce scroll prevention
- PWA install prompts
- Performance optimizations

## Security Best Practices

### 1. Authentication Setup

Claude Code UI includes built-in authentication. Configure it in the UI:
1. Access the login page
2. Create a secure password
3. Enable two-factor authentication (if available)

### 2. Network Security

```bash
# Use strong passwords
openssl rand -base64 32

# Restrict access by IP (iptables example)
sudo iptables -A INPUT -p tcp --dport 3009 -s YOUR_MOBILE_IP/32 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3009 -j DROP
```

### 3. HTTPS Configuration

Always use HTTPS for production:
- Use Let's Encrypt for free SSL certificates
- Configure proper SSL ciphers and protocols
- Enable HSTS (HTTP Strict Transport Security)

### 4. Environment Variables

Never commit sensitive data:
```bash
# Add to .gitignore
.env
ssl/
*.pem
*.key
```

## Troubleshooting

### Common Issues

#### 1. Cannot Connect from Mobile
- Check firewall settings
- Verify correct IP address
- Ensure devices are on same network
- Check that `VITE_HOST=0.0.0.0` is set

#### 2. SSL Certificate Errors
- Ensure certificate includes your IP/domain
- Install and trust certificate on iOS
- Check certificate expiration

#### 3. WebSocket Connection Failed
- Verify WebSocket proxy configuration
- Check for firewall blocking WS traffic
- Ensure correct protocol (ws:// vs wss://)

#### 4. Performance Issues on Mobile
- Enable production mode
- Minimize concurrent operations
- Check network latency
- Clear Safari cache

### Debug Commands

```bash
# Check if ports are open
netstat -tulnp | grep -E '3008|3009'

# Test connectivity
curl -I http://YOUR_IP:3009

# Check logs
npm run dev 2>&1 | tee debug.log

# Monitor resource usage
htop
```

## Performance Optimization

### 1. Production Build

Always use production build for mobile access:
```bash
npm run build
NODE_ENV=production npm start
```

### 2. Enable Compression

Add compression middleware:
```javascript
// In server/index.js
import compression from 'compression';
app.use(compression());
```

### 3. Cache Static Assets

Configure nginx caching:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Optimize for Mobile Networks

- Enable HTTP/2 in nginx
- Implement service worker caching
- Minimize API calls
- Use WebSocket keepalive

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
npm audit fix

# Update Claude Code CLI
npm install -g @anthropic-ai/claude-code@latest
```

### Monitoring

Set up monitoring for production:
- Use PM2 for process management
- Configure log rotation
- Set up uptime monitoring
- Monitor resource usage

### Backup

Regular backups of:
- `.env` configuration
- SSL certificates
- User data (if applicable)
- Session data

## Additional Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Repository Issues](https://github.com/siteboon/claudecodeui/issues)
- [iOS PWA Guide](https://developer.apple.com/documentation/webkit/configuring_your_site_to_work_with_safari)
- [nginx Documentation](https://nginx.org/en/docs/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review repository issues
3. Create a new issue with detailed information
4. Include system info, logs, and steps to reproduce

---

**Note**: This guide assumes you have basic command-line knowledge and administrative access to your system. Always test configurations in a development environment before deploying to production.