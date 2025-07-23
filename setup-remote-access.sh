#!/bin/bash

# Claude Code UI Remote Access Setup Script
# This script configures secure remote access for mobile devices

echo "Claude Code UI - Remote Access Configuration"
echo "==========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run this script as root${NC}"
   exit 1
fi

# Function to generate self-signed SSL certificate
generate_ssl_cert() {
    echo -e "\n${YELLOW}Generating self-signed SSL certificate...${NC}"
    
    # Create ssl directory if it doesn't exist
    mkdir -p ssl
    
    # Generate certificate
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$(hostname -I | awk '{print $1}')" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSL certificate generated successfully${NC}"
        echo "  - Certificate: ssl/cert.pem"
        echo "  - Private key: ssl/key.pem"
    else
        echo -e "${RED}✗ Failed to generate SSL certificate${NC}"
        exit 1
    fi
}

# Function to configure firewall
configure_firewall() {
    echo -e "\n${YELLOW}Configuring firewall rules...${NC}"
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        echo "Configuring UFW firewall..."
        sudo ufw allow 3008/tcp comment 'Claude Code UI API'
        sudo ufw allow 3009/tcp comment 'Claude Code UI Frontend'
        echo -e "${GREEN}✓ Firewall rules added${NC}"
    elif command -v firewall-cmd &> /dev/null; then
        echo "Configuring firewalld..."
        sudo firewall-cmd --permanent --add-port=3008/tcp
        sudo firewall-cmd --permanent --add-port=3009/tcp
        sudo firewall-cmd --reload
        echo -e "${GREEN}✓ Firewall rules added${NC}"
    else
        echo -e "${YELLOW}⚠ No firewall detected. Please manually open ports 3008 and 3009${NC}"
    fi
}

# Function to create systemd service
create_systemd_service() {
    echo -e "\n${YELLOW}Creating systemd service...${NC}"
    
    SERVICE_FILE="/etc/systemd/system/claudecodeui.service"
    
    cat > claudecodeui.service << EOF
[Unit]
Description=Claude Code UI
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="PATH=/usr/bin:/usr/local/bin"

[Install]
WantedBy=multi-user.target
EOF

    echo -e "${GREEN}✓ Service file created${NC}"
    echo "To install the service, run:"
    echo "  sudo cp claudecodeui.service /etc/systemd/system/"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl enable claudecodeui"
    echo "  sudo systemctl start claudecodeui"
}

# Function to setup nginx reverse proxy
setup_nginx() {
    echo -e "\n${YELLOW}Creating nginx configuration...${NC}"
    
    NGINX_CONF="claudecodeui.nginx.conf"
    
    cat > $NGINX_CONF << 'EOF'
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
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' ws: wss: http: https: data: blob: 'unsafe-inline' 'unsafe-eval';" always;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    echo -e "${GREEN}✓ Nginx configuration created: $NGINX_CONF${NC}"
    echo "Edit the file to replace 'your-domain.com' with your actual domain"
}

# Function to display network information
show_network_info() {
    echo -e "\n${YELLOW}Network Information:${NC}"
    echo "===================="
    
    # Get local IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "Local IP: $LOCAL_IP"
    
    # Get public IP
    PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null || echo "Unable to determine")
    echo "Public IP: $PUBLIC_IP"
    
    echo -e "\n${YELLOW}Access URLs:${NC}"
    echo "Local: http://localhost:3009"
    echo "LAN: http://$LOCAL_IP:3009"
    if [ "$PUBLIC_IP" != "Unable to determine" ]; then
        echo "Remote: http://$PUBLIC_IP:3009 (requires port forwarding)"
    fi
}

# Function to create iOS shortcuts configuration
create_ios_config() {
    echo -e "\n${YELLOW}Creating iOS configuration...${NC}"
    
    cat > ios-setup.md << 'EOF'
# iOS Setup Guide for Claude Code UI

## Adding to Home Screen

1. Open Safari on your iPhone/iPad
2. Navigate to your Claude Code UI URL
3. Tap the Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Name it "Claude Code" and tap "Add"

## iOS-Specific Optimizations

The application includes:
- Touch-optimized interface with larger tap targets
- Safe area handling for notched devices
- Viewport lock to prevent accidental zooming
- Optimized navigation bar for thumb reach
- PWA support for app-like experience

## Recommended Settings

1. **Enable Guided Access** (for kiosk mode):
   - Settings > Accessibility > Guided Access
   - Enable Guided Access
   - Set a passcode
   - Triple-click home button to start/stop

2. **Disable Auto-Lock** (for continuous use):
   - Settings > Display & Brightness > Auto-Lock
   - Set to "Never" while using the app

3. **Enable JavaScript** (required):
   - Settings > Safari > Advanced
   - Ensure JavaScript is ON

## Troubleshooting

- **Blank screen**: Clear Safari cache and reload
- **Connection issues**: Check firewall settings
- **Performance**: Close other Safari tabs
- **Touch issues**: Ensure viewport meta tag is present
EOF

    echo -e "${GREEN}✓ iOS setup guide created: ios-setup.md${NC}"
}

# Main menu
echo -e "\n${YELLOW}Select configuration options:${NC}"
echo "1. Generate SSL certificate"
echo "2. Configure firewall"
echo "3. Create systemd service"
echo "4. Setup nginx reverse proxy"
echo "5. Show network information"
echo "6. Create iOS setup guide"
echo "7. Run all configurations"
echo "0. Exit"

while true; do
    read -p "Enter your choice [0-7]: " choice
    case $choice in
        1) generate_ssl_cert ;;
        2) configure_firewall ;;
        3) create_systemd_service ;;
        4) setup_nginx ;;
        5) show_network_info ;;
        6) create_ios_config ;;
        7)
            generate_ssl_cert
            configure_firewall
            create_systemd_service
            setup_nginx
            show_network_info
            create_ios_config
            break
            ;;
        0) 
            echo "Exiting..."
            exit 0
            ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    echo ""
done

echo -e "\n${GREEN}Configuration complete!${NC}"
echo "Next steps:"
echo "1. Review and edit the generated configuration files"
echo "2. Install Node.js v20 if not already installed"
echo "3. Run 'npm install' to install dependencies"
echo "4. Run 'npm run dev' for development or 'npm start' for production"
echo "5. Access the UI from your mobile device using the URLs shown above"