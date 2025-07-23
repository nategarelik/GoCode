#!/bin/bash

# Claude Code UI Quick Start Script
# This script provides a streamlined setup process for mobile access

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Claude Code UI - Quick Start for Mobile Access${NC}"
echo "=============================================="

# Check Node.js version
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js is not installed${NC}"
        echo "Please install Node.js v20 or higher"
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo -e "${RED}✗ Node.js v20 or higher is required${NC}"
        echo "Current version: v$NODE_VERSION"
        echo "Please upgrade Node.js"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js v$NODE_VERSION${NC}"
}

# Check Claude Code CLI
check_claude_cli() {
    if ! command -v claude &> /dev/null; then
        echo -e "${YELLOW}⚠ Claude Code CLI not found${NC}"
        echo "Installing Claude Code CLI..."
        npm install -g @anthropic-ai/claude-code
    else
        echo -e "${GREEN}✓ Claude Code CLI is installed${NC}"
    fi
}

# Setup environment
setup_environment() {
    if [ ! -f .env ]; then
        echo -e "\n${YELLOW}Setting up environment...${NC}"
        cp .env.example .env
        
        # Add mobile access configuration
        echo "" >> .env
        echo "# Mobile Access Configuration" >> .env
        echo "VITE_HOST=0.0.0.0" >> .env
        
        echo -e "${GREEN}✓ Environment configured${NC}"
    else
        echo -e "${GREEN}✓ Environment file exists${NC}"
    fi
}

# Install dependencies
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "\n${YELLOW}Installing dependencies...${NC}"
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
}

# Get network information
show_network_info() {
    echo -e "\n${YELLOW}Network Information:${NC}"
    echo "===================="
    
    # Get local IP
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 1 | awk '{print $7;exit}')
    elif command -v hostname &> /dev/null; then
        LOCAL_IP=$(hostname -I | awk '{print $1}')
    else
        LOCAL_IP="Unable to determine"
    fi
    
    echo "Local IP: $LOCAL_IP"
    echo -e "\n${YELLOW}Access URLs:${NC}"
    echo "Local: http://localhost:3009"
    if [ "$LOCAL_IP" != "Unable to determine" ]; then
        echo "Mobile: http://$LOCAL_IP:3009"
    fi
}

# Create iOS shortcut
create_ios_shortcut() {
    cat > ios-shortcut.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code UI - iOS Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            max-width: 500px;
            margin: 0 auto;
        }
        .step {
            background: #f0f0f0;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            background: #007AFF;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>📱 iOS Quick Setup</h1>
    <p>Follow these steps to add Claude Code UI to your home screen:</p>
    
    <div class="step">
        <strong>Step 1:</strong> Open this page in Safari
    </div>
    
    <div class="step">
        <strong>Step 2:</strong> Tap the Share button (□↑)
    </div>
    
    <div class="step">
        <strong>Step 3:</strong> Scroll down and tap "Add to Home Screen"
    </div>
    
    <div class="step">
        <strong>Step 4:</strong> Name it "Claude Code" and tap "Add"
    </div>
    
    <a href="URL_PLACEHOLDER" class="button">Open Claude Code UI</a>
</body>
</html>
EOF
    echo -e "${GREEN}✓ iOS setup page created: ios-shortcut.html${NC}"
}

# Start menu
start_menu() {
    echo -e "\n${YELLOW}Choose an option:${NC}"
    echo "1. Start in development mode (recommended for first time)"
    echo "2. Start in production mode"
    echo "3. Build for production"
    echo "4. Show network info only"
    echo "5. Exit"
    
    read -p "Enter your choice [1-5]: " choice
    
    case $choice in
        1)
            echo -e "\n${GREEN}Starting development server...${NC}"
            show_network_info
            echo -e "\n${YELLOW}Server starting on ports 3008 (API) and 3009 (Frontend)${NC}"
            echo "Press Ctrl+C to stop"
            npm run dev
            ;;
        2)
            echo -e "\n${GREEN}Building for production...${NC}"
            npm run build
            echo -e "\n${GREEN}Starting production server...${NC}"
            show_network_info
            NODE_ENV=production npm start
            ;;
        3)
            echo -e "\n${GREEN}Building for production...${NC}"
            npm run build
            echo -e "${GREEN}✓ Build complete${NC}"
            echo "Run 'npm start' to start the production server"
            ;;
        4)
            show_network_info
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            start_menu
            ;;
    esac
}

# Main execution
main() {
    echo -e "\n${YELLOW}Running system checks...${NC}"
    check_node_version
    check_claude_cli
    
    echo -e "\n${YELLOW}Setting up project...${NC}"
    setup_environment
    install_dependencies
    create_ios_shortcut
    
    # Update iOS shortcut with actual URL
    if [ -f ios-shortcut.html ]; then
        LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
        sed -i "s|URL_PLACEHOLDER|http://$LOCAL_IP:3009|g" ios-shortcut.html
    fi
    
    echo -e "\n${GREEN}✓ Setup complete!${NC}"
    
    # Show quick tips
    echo -e "\n${YELLOW}Quick Tips:${NC}"
    echo "• Make sure your mobile device is on the same network"
    echo "• Disable 'Prevent Cross-Site Tracking' in Safari for local access"
    echo "• Use the generated ios-shortcut.html for easy iOS setup"
    echo "• Run './setup-remote-access.sh' for advanced configuration"
    
    start_menu
}

# Run main function
main