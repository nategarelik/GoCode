#!/bin/bash

# Staging Deployment Script
# This script deploys the application to staging environment

set -e  # Exit on error

echo "🚀 Starting staging deployment..."

# Load environment variables
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi

# Validate required environment variables
required_vars=("STAGING_HOST" "STAGING_USER" "STAGING_PATH")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

# Build the application
echo "📦 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
npm run build:docker:prod

# Tag image for staging
docker tag claude-code-ui:production claude-code-ui:staging-latest

# Save image to tar file
echo "💾 Saving Docker image..."
docker save claude-code-ui:staging-latest | gzip > claude-ui-staging.tar.gz

# Transfer to staging server
echo "📤 Transferring to staging server..."
scp claude-ui-staging.tar.gz ${STAGING_USER}@${STAGING_HOST}:${STAGING_PATH}/

# Deploy on staging server
echo "🚀 Deploying on staging server..."
ssh ${STAGING_USER}@${STAGING_HOST} << 'ENDSSH'
cd ${STAGING_PATH}

# Load Docker image
echo "Loading Docker image..."
docker load < claude-ui-staging.tar.gz

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Start new containers
echo "Starting new containers..."
docker-compose -f docker-compose.production.yml up -d

# Wait for health check
echo "Waiting for application to be healthy..."
sleep 10
curl -f https://staging.your-domain.com/api/health || exit 1

# Cleanup
rm claude-ui-staging.tar.gz

echo "✅ Staging deployment completed successfully!"
ENDSSH

# Cleanup local file
rm claude-ui-staging.tar.gz

# Run post-deployment tests
echo "🧪 Running post-deployment tests..."
STAGING_URL="https://staging.your-domain.com" npm run test:e2e

echo "✅ Staging deployment completed successfully!"
echo "🔗 Application available at: https://staging.your-domain.com"