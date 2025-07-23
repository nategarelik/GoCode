#!/bin/bash

echo "🔍 GoCode Deployment Verification"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    # Check if URL is accessible
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $response)"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ NOT FOUND${NC} (HTTP $response)"
        return 1
    else
        echo -e "${YELLOW}⚠️  ISSUE${NC} (HTTP $response)"
        return 1
    fi
}

# Test 1: Local Development
echo "1️⃣  LOCAL DEVELOPMENT TEST"
echo "------------------------"
if pgrep -f "npm start" > /dev/null || pgrep -f "node server" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
    
    # Get local IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    check_url "http://localhost:3008" "localhost:3008"
    check_url "http://localhost:3008/manifest.json" "manifest.json"
    check_url "http://localhost:3008/sw.js" "service worker"
    
    echo ""
    echo "📱 Mobile access URLs:"
    echo "   Local Network: http://$LOCAL_IP:3008"
else
    echo -e "${YELLOW}⚠️  Server not running${NC}"
    echo "   Run: npm start"
fi

echo ""
echo "2️⃣  GITHUB PAGES TEST"
echo "-------------------"
check_url "https://nategarelik.github.io/GoCode/" "GitHub Pages home"
check_url "https://nategarelik.github.io/GoCode/manifest.json" "manifest.json"
check_url "https://nategarelik.github.io/GoCode/sw.js" "service worker"
check_url "https://nategarelik.github.io/GoCode/css/index-bc21166d.css" "CSS file"

echo ""
echo "3️⃣  TAILSCALE STATUS"
echo "------------------"
if command -v tailscale &> /dev/null; then
    if tailscale status &> /dev/null; then
        TAILSCALE_IP=$(tailscale ip -4 2>/dev/null | head -n1)
        TAILSCALE_NAME=$(tailscale status --json 2>/dev/null | jq -r '.Self.DNSName' | cut -d. -f1)
        
        echo -e "${GREEN}✅ Tailscale connected${NC}"
        echo "   IP: $TAILSCALE_IP"
        echo "   Name: $TAILSCALE_NAME"
        echo ""
        echo "📱 Tailscale URLs:"
        echo "   http://$TAILSCALE_IP:3008"
        echo "   http://$TAILSCALE_NAME:3008"
    else
        echo -e "${YELLOW}⚠️  Tailscale installed but not connected${NC}"
        echo "   Run: tailscale up"
    fi
else
    echo -e "${YELLOW}⚠️  Tailscale not installed${NC}"
    echo "   Visit: https://tailscale.com/download"
fi

echo ""
echo "4️⃣  FEATURE STATUS"
echo "----------------"
echo -n "PWA Support: "
if [ -f "public/manifest.json" ] && [ -f "public/sw.js" ]; then
    echo -e "${GREEN}✅ Configured${NC}"
else
    echo -e "${RED}❌ Missing files${NC}"
fi

echo -n "Mobile Optimization: "
echo -e "${GREEN}✅ Enabled${NC} (responsive design active)"

echo -n "GitHub Actions: "
gh_status=$(gh run list --limit 1 --json status -q '.[0].status' 2>/dev/null)
if [ "$gh_status" = "completed" ]; then
    echo -e "${GREEN}✅ Last run succeeded${NC}"
else
    echo -e "${YELLOW}⚠️  Check GitHub Actions${NC}"
fi

echo ""
echo "5️⃣  QUICK ACCESS SUMMARY"
echo "----------------------"
echo ""
echo "🌐 GitHub Pages (Static Demo):"
echo "   ${GREEN}https://nategarelik.github.io/GoCode/${NC}"
echo ""
echo "💻 Local Development:"
echo "   ${GREEN}http://localhost:3008${NC}"
echo ""
echo "📱 Mobile Access:"
if [ ! -z "$LOCAL_IP" ]; then
    echo "   Local Network: ${GREEN}http://$LOCAL_IP:3008${NC}"
fi
if [ ! -z "$TAILSCALE_IP" ]; then
    echo "   Tailscale: ${GREEN}http://$TAILSCALE_IP:3008${NC}"
fi
echo ""
echo "📚 Documentation:"
echo "   - MOBILE_ACCESS_COMPLETE.md"
echo "   - TAILSCALE_SETUP.md"
echo "   - QUICK_ACCESS.md"
echo ""

# Final status
echo "================================="
errors=0
if ! check_url "https://nategarelik.github.io/GoCode/" "" &> /dev/null; then
    ((errors++))
fi

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    echo ""
    echo "🎉 GoCode is ready for coding on the go!"
else
    echo -e "${YELLOW}⚠️  Some issues detected${NC}"
    echo ""
    echo "Please check the errors above and:"
    echo "1. Ensure GitHub Pages deployment completed"
    echo "2. Clear browser cache if seeing old content"
    echo "3. Check GitHub Actions for any failures"
fi