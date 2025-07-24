# Production Deployment Guide

This guide covers everything you need to deploy Claude Code UI to production.

## 🚀 Quick Start

1. **Validate Production Readiness**
   ```bash
   ./scripts/validate-production.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your values
   ```

3. **Generate SSL Certificates**
   ```bash
   ./scripts/generate-ssl-cert.sh  # For testing
   # For production, use Let's Encrypt or your CA
   ```

4. **Build and Deploy**
   ```bash
   npm run build:docker:prod
   npm run docker:up
   ```

## 📋 Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Generate strong SESSION_SECRET
- [ ] Configure CORS_ORIGINS for your domain
- [ ] Set up SSL certificates
- [ ] Review security headers in nginx.conf
- [ ] Enable API key authentication if needed

### Database
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Run migrations: `npm run db:migrate`
- [ ] Configure automated backups
- [ ] Test restore procedure

### Infrastructure
- [ ] Configure Redis for sessions
- [ ] Set up monitoring (New Relic/Datadog)
- [ ] Configure log aggregation
- [ ] Set up alerting

### Performance
- [ ] Run load tests
- [ ] Configure CDN for static assets
- [ ] Enable caching headers
- [ ] Optimize Docker images

## 🛠️ Deployment Commands

### Development
```bash
npm run dev                  # Start development server
npm run build               # Build for production
npm run test:all            # Run all tests
```

### Docker
```bash
npm run build:docker        # Build Docker image
npm run build:docker:prod   # Build production Docker image
npm run docker:up           # Start containers
npm run docker:down         # Stop containers
npm run docker:logs         # View logs
```

### Database
```bash
npm run db:migrate          # Run migrations
npm run db:backup           # Create database backup
```

### Deployment
```bash
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
```

### Monitoring
```bash
npm run health:check        # Check application health
npm run security:check      # Check for vulnerabilities
```

## 📁 Project Structure

```
claude-code-ui/
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   └── database/          # Database files
├── src/                   # Frontend application
├── nginx/                 # Nginx configuration
│   ├── nginx.conf        # Main config
│   └── ssl/              # SSL certificates
├── scripts/              # Utility scripts
│   ├── backup/           # Backup scripts
│   ├── database/         # Migration scripts
│   └── deployment/       # Deployment scripts
├── logs/                 # Application logs
└── docker-compose.production.yml
```

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS everywhere
   - Configure firewall rules
   - Implement rate limiting
   - Use WAF if possible

3. **Application Security**
   - Keep dependencies updated
   - Run security audits regularly
   - Enable all security headers
   - Implement proper logging

## 📊 Monitoring

### Health Checks
- `/api/health` - Basic health check
- `/api/metrics` - System metrics

### Logs
- Application logs: `/app/logs/combined.log`
- Error logs: `/app/logs/error.log`
- Nginx logs: `/var/log/nginx/`

### Alerts
Configure alerts for:
- High error rates
- Memory/CPU usage
- Response time degradation
- Failed health checks

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Set up cron job
0 2 * * * /app/scripts/backup/create-full-backup.sh
```

### Manual Backup
```bash
npm run db:backup
```

### Restore Procedure
1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Start application
5. Run health checks

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Database Connection Failed**
   - Check DATABASE_URL
   - Verify database is running
   - Check network connectivity

3. **SSL Certificate Issues**
   - Verify certificate paths
   - Check certificate validity
   - Ensure proper permissions

4. **High Memory Usage**
   - Check for memory leaks
   - Adjust Node.js heap size
   - Scale horizontally

### Debug Mode
```bash
LOG_LEVEL=debug npm run server
```

## 📈 Scaling

### Horizontal Scaling
1. Use load balancer (nginx/HAProxy)
2. Configure session storage (Redis)
3. Share file storage (NFS/S3)
4. Use same database

### Vertical Scaling
1. Increase CPU/Memory
2. Optimize Node.js settings
3. Tune database performance
4. Monitor resource usage

## 🔗 Additional Resources

- [Production Checklist](./PRODUCTION-CHECKLIST.md)
- [Security Best Practices](./docs/SECURITY.md)
- [API Documentation](./docs/API.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📞 Support

For issues or questions:
1. Check the [troubleshooting guide](#-troubleshooting)
2. Review logs for errors
3. Open an issue on GitHub
4. Contact the team

Remember: Always test in staging before deploying to production!