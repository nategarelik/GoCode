#!/bin/bash

# Production Deployment Script for Claude Code UI
# This script automates the deployment process to a production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
PROD_HOST="your-server-ip-or-domain"
PROD_USER="your-server-user"
PROD_PATH="/opt/claudecodeui"
DOMAIN="your-domain.com"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if configuration is set
if [[ "$PROD_HOST" == "your-server-ip-or-domain" ]]; then
    print_error "Please update the configuration variables in this script before running!"
    exit 1
fi

# Start deployment
print_status "Starting production deployment to $PROD_HOST..."

# Step 1: Build Docker images locally
print_status "Building Docker images..."
docker-compose -f docker-compose.production.yml build

# Step 2: Save Docker images
print_status "Saving Docker images..."
docker save claude-code-ui:latest | gzip > claude-code-ui.tar.gz

# Step 3: Copy files to production server
print_status "Copying files to production server..."
ssh $PROD_USER@$PROD_HOST "mkdir -p $PROD_PATH"

# Copy Docker image
scp claude-code-ui.tar.gz $PROD_USER@$PROD_HOST:$PROD_PATH/

# Copy necessary files
scp docker-compose.production.yml $PROD_USER@$PROD_HOST:$PROD_PATH/
scp .env.production $PROD_USER@$PROD_HOST:$PROD_PATH/.env.production
scp -r nginx $PROD_USER@$PROD_HOST:$PROD_PATH/
scp -r scripts $PROD_USER@$PROD_HOST:$PROD_PATH/
scp -r database $PROD_USER@$PROD_HOST:$PROD_PATH/

# Step 4: Execute deployment on production server
print_status "Executing deployment on production server..."
ssh $PROD_USER@$PROD_HOST << 'ENDSSH'
cd /opt/claudecodeui

# Load Docker image
echo "Loading Docker image..."
gunzip -c claude-code-ui.tar.gz | docker load
rm claude-code-ui.tar.gz

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true

# Create data directories
echo "Creating data directories..."
mkdir -p data logs

# Start services
echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.production.yml exec -T app node scripts/database/migrate.js

# Check health
echo "Checking application health..."
if curl -f -k https://localhost/api/health; then
    echo "Application is healthy!"
else
    echo "Health check failed!"
    docker-compose -f docker-compose.production.yml logs
    exit 1
fi
ENDSSH

# Step 5: Clean up local files
print_status "Cleaning up local files..."
rm -f claude-code-ui.tar.gz

# Step 6: Update DNS (reminder)
print_warning "Remember to update your DNS records to point $DOMAIN to $PROD_HOST"

# Step 7: SSL Certificate setup
print_status "SSL Certificate Setup Instructions:"
echo "1. SSH into your server: ssh $PROD_USER@$PROD_HOST"
echo "2. Install certbot: sudo apt install certbot -y"
echo "3. Stop nginx: docker-compose -f $PROD_PATH/docker-compose.production.yml stop nginx"
echo "4. Generate certificates: sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
echo "5. Copy certificates:"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROD_PATH/nginx/ssl/cert.pem"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROD_PATH/nginx/ssl/key.pem"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROD_PATH/nginx/ssl/combined.pem"
echo "6. Update nginx config with your domain"
echo "7. Restart nginx: docker-compose -f $PROD_PATH/docker-compose.production.yml start nginx"

print_status "Deployment complete! 🚀"
print_status "Access your application at https://$DOMAIN"
print_status "Monitor logs with: ssh $PROD_USER@$PROD_HOST 'cd $PROD_PATH && docker-compose -f docker-compose.production.yml logs -f'"