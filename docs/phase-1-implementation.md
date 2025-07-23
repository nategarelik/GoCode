# Phase 1: Foundation & Quick Wins - Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing Phase 1 improvements in ClaudeCodeUI. These quick wins will provide immediate value while laying the foundation for future enhancements.

## 1.1 Dark Mode Implementation

### Step 1: Create Theme Context
Create a new file `src/contexts/ThemeContext.jsx`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('claude-ui-theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('claude-ui-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Step 2: Add CSS Variables
Update `src/index.css`:

```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --accent: #0066cc;
  --accent-hover: #0052a3;
  --border: #e0e0e0;
  --shadow: rgba(0, 0, 0, 0.1);
}

:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;
  --accent: #4da6ff;
  --accent-hover: #66b3ff;
  --border: #404040;
  --shadow: rgba(0, 0, 0, 0.3);
}

/* Smooth transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Step 3: Create Theme Toggle Component
Create `src/components/DarkModeToggle.jsx`:

```javascript
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
```

### Step 4: Update App.jsx
Wrap the app with ThemeProvider:

```javascript
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* existing app content */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

## 1.2 Performance Quick Wins

### Step 1: Implement Code Splitting
Update `src/App.jsx`:

```javascript
import React, { Suspense, lazy } from 'react';

// Lazy load heavy components
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const FileTree = lazy(() => import('./components/FileTree'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const Shell = lazy(() => import('./components/Shell'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
  </div>
);

// Use in render
<Suspense fallback={<LoadingSpinner />}>
  <ChatInterface />
</Suspense>
```

### Step 2: Optimize Vite Config
Update `vite.config.js`:

```javascript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      visualizer({ open: true, gzipSize: true })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'editor': ['@codemirror/lang-javascript', '@codemirror/lang-python'],
            'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3001,
      host: env.VITE_HOST || 'localhost',
      proxy: {
        '/api': `http://localhost:${env.PORT || 3002}`,
        '/ws': {
          target: `ws://localhost:${env.PORT || 3002}`,
          ws: true
        }
      }
    }
  }
})
```

### Step 3: Add Performance Monitoring
Create `src/utils/performance.js`:

```javascript
export const measurePerformance = (metricName, startMark, endMark) => {
  if ('performance' in window) {
    performance.measure(metricName, startMark, endMark);
    const measure = performance.getEntriesByName(metricName)[0];
    console.log(`${metricName}: ${measure.duration}ms`);
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metricName,
        value: Math.round(measure.duration)
      });
    }
  }
};

// Web Vitals monitoring
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
```

## 1.3 Basic Accessibility

### Step 1: Add ARIA Labels
Update all interactive components:

```javascript
// Example: Update button components
<button
  onClick={handleClick}
  aria-label="Create new project"
  aria-pressed={isActive}
  className="..."
>
  <Plus className="w-4 h-4" aria-hidden="true" />
  <span className="sr-only">Create new project</span>
</button>
```

### Step 2: Implement Skip Navigation
Add to `src/App.jsx`:

```javascript
<div className="app">
  <a href="#main-content" className="sr-only focus:not-sr-only">
    Skip to main content
  </a>
  <header>{/* header content */}</header>
  <main id="main-content" tabIndex="-1">
    {/* main content */}
  </main>
</div>
```

### Step 3: Add Focus Styles
Update `src/index.css`:

```css
/* Focus visible styles */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Keyboard navigation indicator */
.keyboard-navigation *:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Step 4: Keyboard Navigation Hook
Create `src/hooks/useKeyboardNavigation.js`:

```javascript
import { useEffect } from 'react';

export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};
```

## 1.4 Docker Setup

### Step 1: Create Dockerfile
Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --chown=nodejs:nodejs package*.json ./

# Install production dependencies
RUN npm ci --production

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3008 3009

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  claudeui:
    build: .
    ports:
      - "3008:3008"
      - "3009:3009"
    environment:
      - NODE_ENV=production
      - PORT=3008
      - VITE_PORT=3009
      - VITE_HOST=0.0.0.0
    volumes:
      - ./data:/app/data
      - ~/.claude:/home/nodejs/.claude:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3008/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - claudeui
    restart: unless-stopped
```

### Step 3: Create .dockerignore
Create `.dockerignore`:

```
node_modules
dist
.env
.env.local
*.log
.DS_Store
.git
.gitignore
README.md
.eslintrc
.prettierrc
coverage
.nyc_output
.github
.vscode
```

### Step 4: Add Health Check Endpoint
Update `server/index.js`:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

## Testing Phase 1

### Dark Mode Testing
1. Toggle between light and dark themes
2. Verify theme persists on page reload
3. Check all components render correctly in both themes
4. Test theme transition animations

### Performance Testing
1. Run Lighthouse audit before and after changes
2. Check bundle size with `npm run build`
3. Verify lazy loading works correctly
4. Test on slow network connections

### Accessibility Testing
1. Navigate entire app using only keyboard
2. Test with screen reader (NVDA/JAWS)
3. Run axe DevTools scan
4. Verify focus indicators are visible

### Docker Testing
1. Build Docker image: `docker build -t claudeui .`
2. Run container: `docker-compose up`
3. Access application at http://localhost
4. Verify all features work in containerized environment

## Rollback Plan

If issues arise during implementation:

1. **Git Strategy**: Each feature in separate branch
2. **Feature Flags**: Use environment variables to toggle features
3. **Monitoring**: Watch error rates and performance metrics
4. **Quick Rollback**: `git revert` or disable feature flag

## Next Steps

After completing Phase 1:
1. Gather user feedback
2. Monitor performance metrics
3. Address any bugs or issues
4. Prepare for Phase 2 implementation

This completes the Phase 1 implementation guide. Each improvement builds upon the previous one, creating a solid foundation for future enhancements.