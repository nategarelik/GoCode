# Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Local Preparation
- [x] Production environment file created (`.env.production`)
- [x] Secure JWT_SECRET generated
- [x] Secure SESSION_SECRET generated  
- [x] Redis password configured
- [x] Docker images built successfully
- [x] Local testing completed
- [x] Health check endpoint verified

### 🔧 Server Requirements
- [ ] Linux server (Ubuntu 20.04+ recommended)
- [ ] Minimum 2GB RAM, 20GB storage
- [ ] Docker and Docker Compose installed
- [ ] Domain name configured
- [ ] Firewall configured (ports 80, 443, 22)

### 📋 Configuration Updates Needed
1. **Update `.env.production`:**
   - [ ] Set `CORS_ORIGINS` to your actual domain
   - [ ] Configure email settings if needed
   - [ ] Add monitoring service keys if using

2. **Update `deploy-production.sh`:**
   - [ ] Set `PROD_HOST` to your server IP/domain
   - [ ] Set `PROD_USER` to your server username
   - [ ] Set `DOMAIN` to your actual domain

3. **Update nginx configuration:**
   - [ ] Replace `your-domain.com` in `nginx/nginx.conf`

## Deployment Steps

### 1. Server Setup
```bash
# On your production server
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
sudo usermod -aG docker $USER
```

### 2. Run Deployment Script
```bash
# From your local machine
./deploy-production.sh
```

### 3. SSL Certificate Setup
```bash
# On production server
sudo apt install certbot -y
cd /opt/claudecodeui
docker-compose -f docker-compose.production.yml stop nginx
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/
docker-compose -f docker-compose.production.yml start nginx
```

### 4. Post-Deployment Verification
- [ ] Access https://your-domain.com
- [ ] Create first admin account
- [ ] Test chat functionality
- [ ] Test file explorer
- [ ] Test terminal access
- [ ] Check WebSocket connections

### 5. Production Monitoring Setup
```bash
# Set up automated backups
crontab -e
# Add: 0 2 * * * /opt/claudecodeui/scripts/backup/create-full-backup.sh

# Set up SSL renewal
# Add: 0 0 1 * * certbot renew --quiet && docker-compose -f /opt/claudecodeui/docker-compose.production.yml restart nginx

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f
```

## Security Checklist
- [ ] Strong passwords set for all secrets
- [ ] Firewall configured and enabled
- [ ] SSL certificates installed
- [ ] Regular update schedule planned
- [ ] Backup strategy implemented
- [ ] Monitoring configured

## Rollback Plan
If issues occur during deployment:

1. **Stop services:**
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. **Restore previous version:**
   ```bash
   git checkout [previous-version]
   docker-compose -f docker-compose.production.yml build
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Restore database backup:**
   ```bash
   ./scripts/backup/restore-backup.sh [backup-file]
   ```

## Troubleshooting Commands
```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Restart services
docker-compose -f docker-compose.production.yml restart

# Check resource usage
docker stats

# Access container shell
docker-compose -f docker-compose.production.yml exec app sh
```

## Important Notes
1. **Secrets Security**: Never commit `.env.production` to git
2. **Domain Setup**: Update DNS records before SSL certificate generation
3. **Backup First**: Always backup before major changes
4. **Monitor Logs**: Watch logs during first 24 hours after deployment
5. **Performance**: Monitor resource usage and scale as needed

## Support Resources
- Application logs: `/opt/claudecodeui/logs/`
- Database: `/opt/claudecodeui/data/claudecode.db`
- Troubleshooting guide: `DOCKER-TROUBLESHOOTING-PLAN.md`
- Deployment guide: `DEPLOYMENT-GUIDE-NEW.md`