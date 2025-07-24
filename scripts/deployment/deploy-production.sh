#!/bin/bash

# Production Deployment Script
# This script deploys the application to production environment

set -e  # Exit on error

# Require explicit confirmation
echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
echo "This will affect live users. Are you sure? (type 'yes' to continue)"
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Validate required environment variables
required_vars=("PROD_HOST" "PROD_USER" "PROD_PATH" "BACKUP_PATH")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run test:ci
npm run security:check

# Create backup
echo "💾 Creating backup..."
ssh ${PROD_USER}@${PROD_HOST} << ENDSSH
cd ${PROD_PATH}
./scripts/backup/create-full-backup.sh
ENDSSH

# Build the application
echo "📦 Building application..."
NODE_ENV=production npm run build

# Build Docker image
echo "🐳 Building Docker image..."
npm run build:docker:prod

# Tag image with version
VERSION=$(node -p "require('./package.json').version")
docker tag claude-code-ui:production claude-code-ui:${VERSION}
docker tag claude-code-ui:production claude-code-ui:production-latest

# Save image to tar file
echo "💾 Saving Docker image..."
docker save claude-code-ui:production-latest | gzip > claude-ui-production.tar.gz

# Transfer to production server
echo "📤 Transferring to production server..."
scp claude-ui-production.tar.gz ${PROD_USER}@${PROD_HOST}:${PROD_PATH}/

# Deploy on production server
echo "🚀 Deploying on production server..."
ssh ${PROD_USER}@${PROD_HOST} << ENDSSH
cd ${PROD_PATH}

# Load Docker image
echo "Loading Docker image..."
docker load < claude-ui-production.tar.gz

# Create rollback point
echo "Creating rollback point..."
docker tag claude-code-ui:production-latest claude-code-ui:rollback

# Stop existing containers (with grace period)
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml stop -t 30

# Start new containers
echo "Starting new containers..."
docker-compose -f docker-compose.production.yml up -d

# Wait for health check
echo "Waiting for application to be healthy..."
for i in {1..30}; do
    if curl -f https://your-domain.com/api/health; then
        echo "✅ Health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed, rolling back..."
        docker tag claude-code-ui:rollback claude-code-ui:production-latest
        docker-compose -f docker-compose.production.yml up -d
        exit 1
    fi
    sleep 2
done

# Run smoke tests
echo "Running smoke tests..."
curl -f https://your-domain.com/api/health || exit 1
curl -f https://your-domain.com/ || exit 1

# Cleanup
rm claude-ui-production.tar.gz
docker image prune -f

echo "✅ Production deployment completed successfully!"
ENDSSH

# Cleanup local file
rm claude-ui-production.tar.gz

# Send deployment notification
echo "📧 Sending deployment notification..."
# Add your notification logic here (Slack, email, etc.)

echo "✅ Production deployment completed successfully!"
echo "🔗 Application available at: https://your-domain.com"
echo "📊 Monitor at: https://your-domain.com/api/metrics"