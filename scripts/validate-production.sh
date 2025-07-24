#!/bin/bash

# Production Validation Script
# Runs comprehensive checks to ensure the application is production-ready

set -e

echo "🔍 Running production readiness validation..."
echo "============================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
ERRORS=0
WARNINGS=0

# Function to check requirement
check() {
    local description=$1
    local command=$2
    local required=${3:-true}
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        if [ "$required" = true ]; then
            echo -e "${RED}✗${NC}"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠${NC}"
            ((WARNINGS++))
        fi
        return 1
    fi
}

echo -e "\n📋 Environment Checks"
echo "---------------------"
check "Node.js installed" "which node"
check "Node.js version >= 18" "node -v | grep -E 'v(1[89]|[2-9][0-9])\.'"
check "npm installed" "which npm"
check "Docker installed" "which docker"
check "Docker Compose installed" "docker compose version"

echo -e "\n🔒 Security Checks"
echo "------------------"
check "No npm vulnerabilities" "npm audit --production --audit-level=high"
check "Environment files exist" "[ -f .env.production.example ]"
check "SSL certificate script exists" "[ -f scripts/generate-ssl-cert.sh ]"
check "No hardcoded secrets" "! grep -rE '(password|secret|key)\\s*[:=]\\s*[\"'\''][^\"'\'']+[\"'\'']' server/ --include='*.js' | grep -v example | grep -v config | grep -v test"

echo -e "\n📁 File Structure Checks"
echo "------------------------"
check "Logs directory exists" "[ -d logs ]"
check "Nginx config exists" "[ -f nginx/nginx.conf ]"
check "Dockerfile exists" "[ -f Dockerfile ]"
check "Docker Compose production file" "[ -f docker-compose.production.yml ]"
check "Database migrations exist" "[ -d database/migrations ]"
check "Backup scripts exist" "[ -f scripts/backup/database-backup.js ]"

echo -e "\n🔧 Configuration Checks"
echo "-----------------------"
check "Security config exists" "[ -f server/config/security.js ]"
check "Error handler exists" "[ -f server/middleware/errorHandler.js ]"
check "Rate limiter exists" "[ -f server/middleware/rateLimiter.js ]"
check "Monitoring middleware exists" "[ -f server/middleware/monitoring.js ]"
check "Health endpoint configured" "grep -q '/api/health' server/index.js"

echo -e "\n📊 Build & Test Checks"
echo "----------------------"
check "Build completes successfully" "npm run build"
check "Lint passes" "npm run lint" false
check "Tests configured" "[ -f package.json ] && grep -q '\"test\"' package.json" false

echo -e "\n🐳 Docker Checks"
echo "----------------"
check "Docker daemon running" "docker info"
check "Docker build succeeds" "docker build -t claude-ui-test:latest -f Dockerfile ." false
check "No large Docker layers" "[ $(docker history claude-ui-test:latest --no-trunc --format '{{.Size}}' | head -5 | grep -c 'MB') -lt 3 ]" false

echo -e "\n📚 Documentation Checks"
echo "-----------------------"
check "README exists" "[ -f README.md ]"
check "Production checklist exists" "[ -f PRODUCTION-CHECKLIST.md ]"
check "Deployment guide exists" "[ -f DEPLOYMENT-GUIDE.md ]" false
check "API documentation exists" "[ -f API.md ] || [ -f docs/API.md ]" false

echo -e "\n🚀 Deployment Readiness"
echo "-----------------------"
check "Deployment scripts exist" "[ -f scripts/deployment/deploy-production.sh ]"
check "Migration script exists" "[ -f scripts/database/migrate.js ]"
check "Backup strategy defined" "[ -f scripts/backup/create-full-backup.sh ]"

# Summary
echo -e "\n============================================"
echo "📊 Validation Summary"
echo "============================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Application is production-ready.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with $WARNINGS warnings.${NC}"
    echo "   The application can be deployed but consider addressing warnings."
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS errors and $WARNINGS warnings.${NC}"
    echo "   Please fix the errors before deploying to production."
    exit 1
fi