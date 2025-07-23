# Phase 3: Developer Experience - Implementation Guide

## Overview
Phase 3 focuses on enhancing the developer experience through CI/CD automation, monitoring, and improved development workflows.

## 3.1 GitHub Actions CI/CD

### Main CI/CD Workflow

#### Step 1: Create Main Workflow
Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  DOCKER_REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Lint and Type Check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npx tsc --noEmit
  
  # Test
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
  
  # Build
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/
  
  # Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --production
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  
  # Docker Build
  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.claudeui.example.com
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your deployment script here
  
  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://claudeui.example.com
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add your deployment script here
```

### Dependency Update Workflow

#### Step 2: Create Dependency Update Workflow
Create `.github/workflows/dependencies.yml`:

```yaml
name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  update-dependencies:
    name: Update Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Update dependencies
        run: |
          npx npm-check-updates -u
          npm install
          npm audit fix
      
      - name: Run tests
        run: npm test
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: 'Weekly dependency updates'
          body: |
            ## Dependency Updates
            
            This PR contains automatic dependency updates.
            
            ### Changes
            - Updated npm dependencies to latest versions
            - Fixed any security vulnerabilities
            
            Please review and test before merging.
          branch: deps/weekly-update
          delete-branch: true
```

## 3.2 Monitoring & Observability

### Sentry Integration

#### Step 1: Install Sentry
```bash
npm install @sentry/react @sentry/tracing
```

#### Step 2: Configure Sentry
Create `src/utils/monitoring.js`:

```javascript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initializeMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
  }
}

export function captureException(error, context) {
  console.error(error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        app: context
      }
    });
  }
}

export function captureMessage(message, level = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  }
}

export function setUser(user) {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email
    });
  }
}
```

#### Step 3: Create Error Boundary
Create `src/components/ErrorBoundary.jsx`:

```javascript
import React from 'react';
import * as Sentry from '@sentry/react';
import { captureException } from '../utils/monitoring';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, {
      component: 'ErrorBoundary',
      ...errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>We've been notified and are working on it.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <div className="error-boundary">
      <h1>Application Error</h1>
      <p>An unexpected error occurred.</p>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
  showDialog: import.meta.env.PROD
});
```

### Performance Monitoring

#### Step 1: Create Analytics Service
Create `src/services/analytics.js`:

```javascript
class Analytics {
  constructor() {
    this.queue = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Google Analytics 4
    if (import.meta.env.VITE_GA_ID) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', import.meta.env.VITE_GA_ID);
    }
    
    this.initialized = true;
    this.flushQueue();
  }

  track(event, properties = {}) {
    if (!this.initialized) {
      this.queue.push({ event, properties });
      return;
    }
    
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', event, properties);
    }
    
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'user',
        message: event,
        level: 'info',
        data: properties
      });
    }
  }

  page(name, properties = {}) {
    this.track('page_view', {
      page_title: name,
      ...properties
    });
  }

  timing(category, variable, value) {
    this.track('timing_complete', {
      event_category: category,
      name: variable,
      value: Math.round(value)
    });
  }

  flushQueue() {
    while (this.queue.length > 0) {
      const { event, properties } = this.queue.shift();
      this.track(event, properties);
    }
  }
}

export const analytics = new Analytics();
```

#### Step 2: Create Performance Observer
Create `src/utils/performanceObserver.js`:

```javascript
import { analytics } from '../services/analytics';

export function initPerformanceObserver() {
  if ('PerformanceObserver' in window) {
    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          analytics.track('long_task', {
            duration: entry.duration,
            start_time: entry.startTime,
            name: entry.name
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task observer not supported');
    }

    // Observe layout shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        analytics.track('cumulative_layout_shift', { value: cls });
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('Layout shift observer not supported');
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        analytics.track('largest_contentful_paint', {
          value: lastEntry.renderTime || lastEntry.loadTime,
          element: lastEntry.element?.tagName
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }
  }
}
```

### Health Check System

#### Step 1: Create Health Check Endpoint
Update `server/index.js`:

```javascript
// Detailed health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {}
  };

  // Check database connection
  try {
    await db.get('SELECT 1');
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.checks.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
    health.status = 'degraded';
  }

  // Check file system access
  try {
    const fs = require('fs').promises;
    await fs.access(process.env.CLAUDE_PROJECTS_PATH || '~/.claude/projects');
    health.checks.filesystem = { status: 'healthy' };
  } catch (error) {
    health.checks.filesystem = { 
      status: 'unhealthy', 
      error: 'Cannot access projects directory' 
    };
    health.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = {
    status: memoryUsagePercent > 90 ? 'warning' : 'healthy',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    percentage: memoryUsagePercent.toFixed(2) + '%'
  };

  // Check Claude CLI availability
  try {
    const { exec } = require('child_process').promises;
    await exec('which claude');
    health.checks.claudeCLI = { status: 'healthy' };
  } catch (error) {
    health.checks.claudeCLI = { 
      status: 'unhealthy', 
      error: 'Claude CLI not found' 
    };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## 3.3 Developer Tools

### Development Setup Script

#### Step 1: Create Setup Script
Create `scripts/dev-setup.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 ClaudeCodeUI Development Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    else
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    fi
}

echo "Checking prerequisites..."
MISSING_DEPS=0

check_command node || MISSING_DEPS=1
check_command npm || MISSING_DEPS=1
check_command git || MISSING_DEPS=1
check_command claude || echo -e "${YELLOW}⚠${NC} Claude CLI not found (optional)"

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}Please install missing dependencies and try again${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Node.js 20 or higher is required!${NC}"
    exit 1
fi

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
npm ci

# Setup git hooks
echo -e "\n${GREEN}Setting up git hooks...${NC}"
npx husky install

# Create .env file
if [ ! -f .env ]; then
    echo -e "\n${GREEN}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your settings${NC}"
fi

# Create necessary directories
echo -e "\n${GREEN}Creating directories...${NC}"
mkdir -p logs
mkdir -p data
mkdir -p .github/workflows

# Install recommended VS Code extensions
if command -v code &> /dev/null; then
    echo -e "\n${GREEN}Installing VS Code extensions...${NC}"
    code --install-extension dbaeumer.vscode-eslint
    code --install-extension esbenp.prettier-vscode
    code --install-extension bradlc.vscode-tailwindcss
fi

# Setup pre-commit hooks
echo -e "\n${GREEN}Setting up pre-commit hooks...${NC}"
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm test -- --run
EOF
chmod +x .husky/pre-commit

# Run initial build
echo -e "\n${GREEN}Running initial build...${NC}"
npm run build

echo -e "\n${GREEN}✓ Development setup complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. Update .env with your configuration"
echo -e "2. Run 'npm run dev' to start development server"
echo -e "3. Open http://localhost:3009"
```

### Hot Module Replacement Enhancement

#### Step 2: Update Vite Config for Better HMR
Update `vite.config.js`:

```javascript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        // Better HMR
        fastRefresh: true,
        babel: {
          plugins: [
            // Add React Refresh for better HMR
            mode === 'development' && 'react-refresh/babel'
          ].filter(Boolean)
        }
      }),
      mode === 'analyze' && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ],
    server: {
      port: parseInt(env.VITE_PORT) || 3001,
      host: env.VITE_HOST || 'localhost',
      hmr: {
        overlay: true,
        port: parseInt(env.VITE_PORT) || 3001
      },
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 3002}`,
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
          }
        },
        '/ws': {
          target: `ws://localhost:${env.PORT || 3002}`,
          ws: true,
          changeOrigin: true
        }
      }
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'editor': ['@codemirror/lang-javascript', '@codemirror/lang-python'],
            'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
            'chart': ['recharts']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
})
```

### Debug Configuration

#### Step 3: Create Debug Utilities
Create `src/utils/debug.js`:

```javascript
const DEBUG = import.meta.env.DEV || localStorage.getItem('debug') === 'true';

class DebugLogger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = DEBUG;
    this.color = this.getRandomColor();
  }

  getRandomColor() {
    const colors = [
      '#0088cc', '#44bb44', '#ff6600', '#aa00aa', 
      '#00aaaa', '#ffaa00', '#ff0066', '#6600ff'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  log(...args) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().substr(11, 12);
    console.log(
      `%c[${timestamp}] ${this.namespace}`,
      `color: ${this.color}; font-weight: bold`,
      ...args
    );
  }

  error(...args) {
    if (!this.enabled) return;
    console.error(`[${this.namespace}]`, ...args);
  }

  warn(...args) {
    if (!this.enabled) return;
    console.warn(`[${this.namespace}]`, ...args);
  }

  time(label) {
    if (!this.enabled) return;
    console.time(`${this.namespace}:${label}`);
  }

  timeEnd(label) {
    if (!this.enabled) return;
    console.timeEnd(`${this.namespace}:${label}`);
  }

  group(label) {
    if (!this.enabled) return;
    console.group(`${this.namespace}:${label}`);
  }

  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }
}

export function createDebugger(namespace) {
  return new DebugLogger(namespace);
}

// Debug panel component
export function DebugPanel() {
  if (!DEBUG) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>Version: {import.meta.env.VITE_APP_VERSION}</div>
      <div>API: {import.meta.env.VITE_API_URL}</div>
      <button
        onClick={() => {
          localStorage.removeItem('debug');
          window.location.reload();
        }}
        className="mt-2 px-2 py-1 bg-red-600 rounded"
      >
        Disable Debug
      </button>
    </div>
  );
}
```

## Testing Phase 3

### CI/CD Testing
1. Push to feature branch and verify workflow runs
2. Check all jobs complete successfully
3. Verify Docker image builds
4. Test deployment to staging

### Monitoring Testing
1. Trigger errors and check Sentry
2. Verify performance metrics
3. Check health endpoint
4. Test analytics tracking

### Developer Tools Testing
1. Run setup script on fresh clone
2. Test hot module replacement
3. Use debug utilities
4. Verify git hooks work

## Next Steps
Continue to Phase 4 for Advanced Features implementation.