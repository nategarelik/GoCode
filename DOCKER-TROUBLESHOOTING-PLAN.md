# Docker Troubleshooting Plan - Claude Code UI

## Issue Summary

1. **CSS files not loading** - The compiled CSS file exists at `/dist/css/main-BMf5PQ1P.css` but is not being served properly by nginx
2. **WebSocket connection failures** - Repeated "Invalid frame header" errors when connecting through nginx proxy
3. **UI completely unstyled** - Application loads but without any CSS styling applied

## Root Cause Analysis

### 1. CSS Loading Issue
- **Problem**: The nginx configuration is serving files from `/usr/share/nginx/html` but the Docker setup has a mismatch
- **Evidence**: 
  - CSS file exists in `dist/css/main-BMf5PQ1P.css`
  - Vite config outputs CSS to `css/[name]-[hash].css`
  - nginx is configured to serve from `/usr/share/nginx/html`
  - Docker compose mounts `./dist` to nginx container

### 2. WebSocket Proxy Issue
- **Problem**: nginx WebSocket configuration is incomplete
- **Evidence**: "Invalid frame header" errors indicate missing or incorrect proxy headers
- **Missing**: The `map` directive for connection upgrade is not present in nginx.conf

### 3. Architecture Conflict
- **Problem**: The app runs on port 3000 but nginx is trying to serve static files separately
- **Evidence**: 
  - App container serves the full application on port 3000
  - nginx container also tries to serve static files from `/usr/share/nginx/html`
  - This creates a conflict in how assets are served

## Solution Plan

### Phase 1: Fix nginx Configuration (Immediate)

1. **Update nginx.conf** to properly handle WebSocket connections:
```nginx
# Add at http level
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

2. **Fix static file serving** - Remove the duplicate static file serving from nginx since the app serves its own assets:
```nginx
# Remove the root directive and static file location
# Let the app handle all requests including static assets
location / {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Phase 2: Simplify Docker Architecture

The current setup has unnecessary complexity. The app already serves static files through Express, so nginx should only act as a reverse proxy, not serve static files separately.

1. **Remove static file volume mount** from docker-compose.production.yml:
```yaml
# Remove this line from nginx volumes:
# - ./dist:/usr/share/nginx/html:ro
```

2. **Update nginx to pure reverse proxy** configuration

### Phase 3: Fix WebSocket Configuration

Add proper WebSocket handling to nginx:
```nginx
location /ws {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

## Implementation Steps

1. **Backup current configuration**
   ```bash
   cp nginx/nginx.conf nginx/nginx.conf.backup
   cp docker-compose.production.yml docker-compose.production.yml.backup
   ```

2. **Update nginx.conf** with the fixes

3. **Update docker-compose.production.yml** to remove static file mount

4. **Rebuild and restart containers**
   ```bash
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d --build
   ```

5. **Test the application**
   - Check if CSS loads properly
   - Verify WebSocket connections work
   - Monitor nginx logs for any errors

## Alternative Solution (If above doesn't work)

If the application needs nginx to serve static files separately for performance:

1. **Fix the build process** to ensure static files are copied correctly
2. **Update Dockerfile** to copy dist files to nginx
3. **Configure nginx** to serve static files with correct MIME types
4. **Set up proper routing** between static files and API requests

## Testing Checklist

- [ ] CSS file loads with correct MIME type (text/css)
- [ ] WebSocket connections establish without errors
- [ ] All API endpoints work through nginx proxy
- [ ] Static assets (images, fonts) load correctly
- [ ] No console errors in browser
- [ ] Application styling appears correctly

## Monitoring

After fixes are applied:
1. Check nginx error logs: `docker logs claude-ui-nginx`
2. Check app logs: `docker logs claude-ui-app`
3. Monitor browser console for any errors
4. Use browser Network tab to verify asset loading

## Prevention

1. Add health checks for CSS loading
2. Implement automated tests for WebSocket connections
3. Use docker-compose override files for different environments
4. Document the architecture clearly for future reference