#!/bin/bash

echo "🚀 Optimizing GoCode for Tailscale access..."

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Create optimized environment configuration
cat > .env.tailscale << EOF
# Tailscale Optimized Configuration
NODE_ENV=production
PORT=3008

# Performance optimizations
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6
CACHE_STATIC_ASSETS=true
CACHE_TTL=86400

# Mobile optimizations
MOBILE_OPTIMIZED=true
REDUCE_ANIMATIONS=true
AGGRESSIVE_CACHING=true

# Security
SECURE_COOKIES=false
TRUST_PROXY=true

# Logging
LOG_LEVEL=warn
EOF

# Get Tailscale machine name and IP
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null | head -n1)
    TAILSCALE_NAME=$(tailscale status --json 2>/dev/null | jq -r '.Self.DNSName' | cut -d. -f1)
    
    if [ ! -z "$TAILSCALE_IP" ]; then
        echo "✅ Tailscale detected!"
        echo "   IP: $TAILSCALE_IP"
        echo "   Name: $TAILSCALE_NAME"
        
        # Create quick access script
        cat > start-tailscale.sh << EOF
#!/bin/bash
echo "🚀 Starting GoCode for Tailscale access..."
echo ""
echo "📱 Access from any device:"
echo "   http://$TAILSCALE_IP:3008"
echo "   http://$TAILSCALE_NAME:3008"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Load Tailscale environment
export \$(cat .env.tailscale | grep -v '^#' | xargs)

# Start the server
npm start
EOF
        chmod +x start-tailscale.sh
        
        # Create mobile-friendly index page
        cat > public/mobile-index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>GoCode - Mobile Access</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
            text-align: center;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            font-size: 2em;
            margin-bottom: 20px;
        }
        .access-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .url {
            font-family: 'Courier New', monospace;
            background: #3a3a3a;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            word-break: break-all;
            user-select: all;
            -webkit-user-select: all;
        }
        .button {
            display: inline-block;
            background: #0066cc;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin: 10px;
            font-weight: 600;
        }
        .tip {
            background: #2a2a2a;
            border-left: 4px solid #0066cc;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
        }
        .icon {
            font-size: 3em;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🚀</div>
        <h1>GoCode Mobile Access</h1>
        
        <div class="access-card">
            <h2>Quick Access URLs</h2>
            <div class="url">http://TAILSCALE_IP:3008</div>
            <div class="url">http://TAILSCALE_NAME:3008</div>
        </div>
        
        <div class="tip">
            <strong>💡 Pro Tip:</strong> Add this page to your home screen for one-tap access!
            <br><br>
            iOS: Share → Add to Home Screen<br>
            Android: Menu → Add to Home screen
        </div>
        
        <a href="/" class="button">Open GoCode</a>
        
        <div class="access-card" style="margin-top: 40px;">
            <h3>Mobile Features</h3>
            <ul style="text-align: left; list-style: none; padding: 0;">
                <li>✅ Touch-optimized interface</li>
                <li>✅ Responsive design</li>
                <li>✅ Offline support</li>
                <li>✅ File management</li>
                <li>✅ Integrated terminal</li>
                <li>✅ Real-time collaboration</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Replace placeholders with actual values
        document.body.innerHTML = document.body.innerHTML
            .replace(/TAILSCALE_IP/g, '$TAILSCALE_IP')
            .replace(/TAILSCALE_NAME/g, '$TAILSCALE_NAME');
            
        // Auto-redirect to main app after 3 seconds if not mobile
        if (!/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }
    </script>
</body>
</html>
EOF
        
        echo ""
        echo "✅ Optimization complete!"
        echo ""
        echo "📱 To start GoCode for Tailscale access, run:"
        echo "   ./start-tailscale.sh"
        echo ""
        echo "🌐 Access URLs:"
        echo "   http://$TAILSCALE_IP:3008"
        echo "   http://$TAILSCALE_NAME:3008"
        echo ""
    else
        echo "⚠️  Tailscale is installed but not connected"
        echo "   Run: tailscale up"
    fi
else
    echo "⚠️  Tailscale not found. Please install Tailscale first:"
    echo "   https://tailscale.com/download"
fi

# Create PM2 ecosystem file for production deployment
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gocode',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    // Auto-restart on crash
    autorestart: true,
    // Wait before restarting
    restart_delay: 4000,
    // Max memory before restart
    max_memory_restart: '1G',
    // Log configuration
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_file: 'logs/combined.log',
    time: true,
    // Load balancing (if using multiple cores)
    instances: 1,
    exec_mode: 'fork'
  }]
};
EOF

echo "✨ Additional features configured:"
echo "   - PM2 ecosystem file for production deployment"
echo "   - Mobile-optimized landing page"
echo "   - Performance optimizations"
echo "   - Quick start script"