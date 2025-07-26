# Production Deployment Guide

This guide walks you through deploying Claude Code UI to production.

## Prerequisites

- A Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointed to your server
- At least 2GB RAM and 20GB storage

## Step 1: Prepare Your Server

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group
sudo usermod -aG docker $USER
```

### 1.3 Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 2: Clone and Configure

### 2.1 Clone Repository
```bash
# Create app directory
sudo mkdir -p /opt/claudecodeui
sudo chown $USER:$USER /opt/claudecodeui
cd /opt/claudecodeui

# Clone the repository
git clone https://github.com/nategarelik/GoCode.git .
```

### 2.2 Configure Environment
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your settings
nano .env.production
```

Required environment variables:
```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-very-secure-random-string-here
SESSION_SECRET=another-very-secure-random-string

# Database
DATABASE_PATH=/app/data/claudecode.db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2.3 Generate SSL Certificates

For production with a real domain:
```bash
# Install certbot
sudo apt install certbot -y

# Generate certificates (replace example.com with your domain)
sudo certbot certonly --standalone -d example.com -d www.example.com

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/example.com/privkey.pem nginx/ssl/key.pem
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem nginx/ssl/combined.pem
```

For local testing/development:
```bash
# Use the self-signed certificate generator
./scripts/generate-ssl-cert.sh
```

## Step 3: Build and Deploy

### 3.1 Build Docker Images
```bash
# Build production images
docker-compose -f docker-compose.production.yml build
```

### 3.2 Start Services
```bash
# Start all services in detached mode
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3.3 Initialize Database
```bash
# Run database migrations
docker-compose -f docker-compose.production.yml exec app npm run db:migrate
```

## Step 4: Verify Deployment

### 4.1 Health Checks
```bash
# Check application health
curl -k https://localhost/api/health

# Check individual services
docker-compose -f docker-compose.production.yml ps
```

### 4.2 Access the Application
- Open your browser to `https://your-domain.com`
- You should see the Claude Code UI login page
- Create your first admin account

## Step 5: Post-Deployment

### 5.1 Set Up Automated Backups
```bash
# Add to crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/claudecodeui/scripts/backup/create-full-backup.sh
```

### 5.2 Configure Monitoring
```bash
# Install monitoring stack (optional)
docker run -d \
  --name=netdata \
  -p 19999:19999 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --cap-add SYS_PTRACE \
  --security-opt apparmor=unconfined \
  netdata/netdata
```

### 5.3 SSL Certificate Renewal
```bash
# Add to crontab for auto-renewal
0 0 1 * * certbot renew --quiet && docker-compose -f /opt/claudecodeui/docker-compose.production.yml restart nginx
```

## Troubleshooting

### Container Issues
```bash
# View detailed logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Restart a specific service
docker-compose -f docker-compose.production.yml restart [service-name]

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Database Issues
```bash
# Access database
docker-compose -f docker-compose.production.yml exec app sqlite3 /app/data/claudecode.db

# Backup database
docker-compose -f docker-compose.production.yml exec app npm run db:backup
```

### Performance Issues
```bash
# Check resource usage
docker stats

# View nginx access logs
docker-compose -f docker-compose.production.yml logs nginx

# Check Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli -a your-redis-password
```

## Security Recommendations

1. **Regular Updates**
   ```bash
   # Update application
   cd /opt/claudecodeui
   git pull origin main
   docker-compose -f docker-compose.production.yml up -d --build
   ```

2. **Firewall Rules**
   - Only allow necessary ports
   - Use fail2ban for brute force protection

3. **Secrets Management**
   - Use strong, unique passwords
   - Rotate secrets regularly
   - Never commit secrets to git

4. **Monitoring**
   - Set up alerts for high CPU/memory usage
   - Monitor error rates
   - Track authentication failures

## Rollback Procedure

If issues occur:
```bash
# Stop current deployment
docker-compose -f docker-compose.production.yml down

# Restore previous version
git checkout [previous-commit-hash]

# Rebuild and start
docker-compose -f docker-compose.production.yml up -d --build

# Restore database backup if needed
./scripts/backup/restore-backup.sh [backup-file]
```

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.production.yml logs`
- Review troubleshooting guide: [DOCKER-TROUBLESHOOTING-PLAN.md](DOCKER-TROUBLESHOOTING-PLAN.md)
- Open an issue on GitHub