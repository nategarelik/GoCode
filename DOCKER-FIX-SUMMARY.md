# Docker Fix Summary - Claude Code UI

## Changes Applied

### 1. nginx.conf Updates

**Added WebSocket upgrade map** (line 16-20):
```nginx
# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

**Converted to pure reverse proxy** (replaced static file serving):
```nginx
# Proxy all requests to the app
location / {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Fixed WebSocket configuration** (updated Connection header):
```nginx
proxy_set_header Connection $connection_upgrade;  # Changed from "upgrade"
```

### 2. docker-compose.production.yml Updates

**Removed static file mount** from nginx volumes:
```yaml
# Removed this line:
# - ./dist:/usr/share/nginx/html:ro
```

## To Apply Changes

1. **Stop current containers**:
```bash
docker-compose -f docker-compose.production.yml down
```

2. **Rebuild and start containers**:
```bash
docker-compose -f docker-compose.production.yml up -d --build
```

3. **Check logs for any errors**:
```bash
docker-compose -f docker-compose.production.yml logs -f
```

## What This Fixes

1. **CSS Loading**: nginx now proxies all requests to your Express app which correctly serves the CSS files
2. **WebSocket Errors**: Proper upgrade headers prevent "Invalid frame header" errors
3. **Architecture**: Simplified to single-serving through Express app, eliminating conflicts

## Verification Steps

1. Open the app in browser
2. Check that CSS styles are applied
3. Open browser console - no WebSocket errors should appear
4. Verify all functionality works correctly

## Rollback (if needed)

Backup files were created:
- `nginx/nginx.conf.backup`
- `docker-compose.production.yml.backup`

To rollback:
```bash
cp nginx/nginx.conf.backup nginx/nginx.conf
cp docker-compose.production.yml.backup docker-compose.production.yml
```