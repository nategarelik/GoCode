# Production Deployment Example

This is an example of what the deployment process would look like with real server details.

## Example Configuration

Let's assume:
- Server IP: `165.232.10.20`
- Username: `root`
- Domain: `claudecodeui.example.com`

## Step 1: Update Deployment Script

```bash
# Update deploy-production.sh with actual values
sed -i 's/PROD_HOST="your-server-ip-or-domain"/PROD_HOST="165.232.10.20"/' deploy-production.sh
sed -i 's/PROD_USER="your-server-user"/PROD_USER="root"/' deploy-production.sh
sed -i 's/DOMAIN="your-domain.com"/DOMAIN="claudecodeui.example.com"/' deploy-production.sh
```

## Step 2: Update Environment Configuration

```bash
# Update .env.production with actual domain
sed -i 's|CORS_ORIGINS=https://localhost,https://your-domain.com|CORS_ORIGINS=https://claudecodeui.example.com,https://www.claudecodeui.example.com|' .env.production
```

## Step 3: Execute Deployment

```bash
./deploy-production.sh
```

This would:
1. Build Docker images locally
2. Save and compress the image
3. Copy everything to the server
4. Load the image on the server
5. Start all services
6. Run database migrations
7. Verify health status

## Step 4: Server-Side SSL Setup

After deployment, on the server:

```bash
# SSH into server
ssh root@165.232.10.20

# Navigate to app directory
cd /opt/claudecodeui

# Stop nginx temporarily
docker-compose -f docker-compose.production.yml stop nginx

# Generate Let's Encrypt certificates
sudo certbot certonly --standalone \
  -d claudecodeui.example.com \
  -d www.claudecodeui.example.com \
  --non-interactive \
  --agree-tos \
  --email admin@example.com

# Copy certificates to nginx
sudo cp /etc/letsencrypt/live/claudecodeui.example.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/claudecodeui.example.com/privkey.pem nginx/ssl/key.pem
sudo cp /etc/letsencrypt/live/claudecodeui.example.com/fullchain.pem nginx/ssl/combined.pem
sudo chown -R $(whoami):$(whoami) nginx/ssl/

# Restart nginx
docker-compose -f docker-compose.production.yml start nginx

# Verify deployment
curl -I https://claudecodeui.example.com
```

## Step 5: Post-Deployment Setup

```bash
# Set up automatic backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/claudecodeui/scripts/backup/create-full-backup.sh") | crontab -

# Set up SSL renewal
(crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet && docker-compose -f /opt/claudecodeui/docker-compose.production.yml restart nginx") | crontab -

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f
```

## Expected Results

After successful deployment:
- Application accessible at: https://claudecodeui.example.com
- Health check endpoint: https://claudecodeui.example.com/api/health
- WebSocket connections working for real-time features
- All static assets loading correctly with UnoCSS
- SSL/TLS encryption active
- Automatic backups running daily at 2 AM
- SSL certificates auto-renewing monthly

## Monitoring Commands

```bash
# Check all services
docker-compose -f docker-compose.production.yml ps

# View application logs
docker-compose -f docker-compose.production.yml logs app -f

# Check resource usage
docker stats

# Database backup
docker-compose -f docker-compose.production.yml exec app npm run db:backup
```