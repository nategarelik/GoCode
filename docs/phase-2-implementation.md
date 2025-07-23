# Phase 2: Performance & Accessibility - Implementation Guide

## Overview
Phase 2 focuses on deep performance optimization and comprehensive accessibility features, building upon the foundation established in Phase 1.

## 2.1 Advanced Performance Optimization

### Service Worker Implementation

#### Step 1: Create Service Worker
Create `public/sw.js`:

```javascript
const CACHE_NAME = 'claude-ui-v1';
const RUNTIME = 'runtime';

// Cache essential assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html'
];

// Install event - cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests differently
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(RUNTIME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME).then(cache => {
        return fetch(request).then(response => {
          return cache.put(request, response.clone()).then(() => {
            return response;
          });
        }).catch(() => {
          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const cache = await caches.open('offline-messages');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

#### Step 2: Register Service Worker
Update `src/main.jsx`:

```javascript
// Service Worker registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => console.error('SW registration failed:', error));
  });
}
```

#### Step 3: Create Offline Page
Create `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Claude Code UI</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .offline-container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    h1 { color: #333; }
    p { color: #666; }
    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 1rem;
    }
    button:hover { background: #0052a3; }
  </style>
</head>
<body>
  <div class="offline-container">
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Some features may be unavailable.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

### Virtual Scrolling Implementation

#### Step 1: Install Dependencies
```bash
npm install @tanstack/react-virtual
```

#### Step 2: Create Virtual List Component
Create `src/components/VirtualList.jsx`:

```javascript
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function VirtualList({ items, renderItem, height = 400, estimateSize = 50 }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: `${height}px`,
        overflow: 'auto'
      }}
      className="virtual-list-container"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Step 3: Update Chat Component for Virtual Scrolling
Update `src/components/ChatInterface.jsx`:

```javascript
import VirtualList from './VirtualList';

// In the render method, replace the messages list with:
<VirtualList
  items={messages}
  height={containerHeight}
  estimateSize={100}
  renderItem={(message, index) => (
    <MessageComponent key={message.id} message={message} />
  )}
/>
```

### Resource Optimization

#### Step 1: Implement Resource Hints
Update `index.html`:

```html
<head>
  <!-- Preconnect to API server -->
  <link rel="preconnect" href="http://localhost:3008">
  
  <!-- Prefetch critical resources -->
  <link rel="prefetch" href="/api/projects">
  
  <!-- Preload critical fonts -->
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
</head>
```

#### Step 2: Implement Image Optimization
Create `src/components/OptimizedImage.jsx`:

```javascript
import React, { useState, useEffect } from 'react';

export default function OptimizedImage({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  loading = 'lazy' 
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if WebP is supported
    const webpSupport = new Promise(resolve => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        resolve(webp.height === 2);
      };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });

    webpSupport.then(hasWebP => {
      if (hasWebP && src.includes('.jpg') || src.includes('.png')) {
        setImageSrc(src.replace(/\.(jpg|png)$/, '.webp'));
      } else {
        setImageSrc(src);
      }
    });
  }, [src]);

  if (error) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-500">Image failed to load</span>
      </div>
    );
  }

  return imageSrc ? (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      onError={() => {
        setError(true);
      }}
    />
  ) : (
    <div className={`${className} bg-gray-200 animate-pulse`} />
  );
}
```

## 2.2 Comprehensive Accessibility

### Live Regions Implementation

#### Step 1: Create Announcer Component
Create `src/components/ScreenReaderAnnouncer.jsx`:

```javascript
import React, { useEffect, useRef } from 'react';
import { useAnnouncements } from '../hooks/useAnnouncements';

export default function ScreenReaderAnnouncer() {
  const { announcements, clearAnnouncement } = useAnnouncements();
  const liveRegionRef = useRef();

  useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[announcements.length - 1];
      
      // Announce to screen reader
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = latest.message;
      }

      // Clear after announcement
      setTimeout(() => {
        clearAnnouncement(latest.id);
      }, 1000);
    }
  }, [announcements, clearAnnouncement]);

  return (
    <>
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.priority === 'high')
          .map(a => a.message)
          .join('. ')}
      </div>
    </>
  );
}
```

#### Step 2: Create Announcements Hook
Create `src/hooks/useAnnouncements.js`:

```javascript
import { create } from 'zustand';

const useAnnouncementStore = create((set) => ({
  announcements: [],
  
  announce: (message, priority = 'normal') => set((state) => ({
    announcements: [...state.announcements, {
      id: Date.now(),
      message,
      priority,
      timestamp: new Date()
    }]
  })),
  
  clearAnnouncement: (id) => set((state) => ({
    announcements: state.announcements.filter(a => a.id !== id)
  })),
  
  clearAll: () => set({ announcements: [] })
}));

export const useAnnouncements = () => {
  const { announcements, announce, clearAnnouncement, clearAll } = useAnnouncementStore();
  
  return {
    announcements,
    announce,
    clearAnnouncement,
    clearAll
  };
};
```

### High Contrast Theme

#### Step 1: Add High Contrast CSS Variables
Update `src/index.css`:

```css
:root[data-theme="high-contrast"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #ffffff;
  --text-tertiary: #cccccc;
  --accent: #ffff00;
  --accent-hover: #ffff66;
  --border: #ffffff;
  --shadow: none;
  
  /* High contrast specific */
  --focus-outline: 3px solid #ffff00;
  --link-underline: underline;
  --button-border: 2px solid #ffffff;
}

/* High contrast mode adjustments */
[data-theme="high-contrast"] {
  /* Remove all shadows */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  /* Strong borders */
  button, input, textarea, select {
    border: var(--button-border) !important;
  }
  
  /* Underline all links */
  a {
    text-decoration: var(--link-underline) !important;
  }
  
  /* High contrast focus */
  *:focus {
    outline: var(--focus-outline) !important;
    outline-offset: 2px !important;
  }
}
```

### Reduced Motion Support

#### Step 1: Create Motion Preference Hook
Create `src/hooks/useReducedMotion.js`:

```javascript
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
```

#### Step 2: Apply Reduced Motion Styles
Update `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .animate-spin {
    animation: none !important;
  }
  
  .transition-all {
    transition: none !important;
  }
}
```

## 2.3 Mobile PWA Enhancements

### Enhanced Manifest
Update `public/manifest.json`:

```json
{
  "name": "Claude Code UI",
  "short_name": "Claude UI",
  "description": "A modern UI for Claude Code CLI",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0066cc",
  "background_color": "#ffffff",
  "orientation": "any",
  "categories": ["productivity", "developer", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "New Chat",
      "short_name": "Chat",
      "description": "Start a new chat session",
      "url": "/chat/new",
      "icons": [{ "src": "/icons/chat.png", "sizes": "96x96" }]
    },
    {
      "name": "Projects",
      "short_name": "Projects",
      "description": "View all projects",
      "url": "/projects",
      "icons": [{ "src": "/icons/projects.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-main.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Desktop view of Claude Code UI"
    },
    {
      "src": "/screenshots/mobile-chat.png",
      "sizes": "750x1334",
      "type": "image/png",
      "label": "Mobile chat interface"
    }
  ]
}
```

### Install Prompt Handler
Create `src/hooks/useInstallPrompt.js`:

```javascript
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      return true;
    }
    
    return false;
  };

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    install
  };
}
```

## Testing Phase 2

### Performance Testing
1. Run Lighthouse audit with throttling
2. Test service worker caching
3. Verify offline functionality
4. Check virtual scrolling performance
5. Monitor memory usage

### Accessibility Testing
1. Test with multiple screen readers
2. Navigate with keyboard only
3. Check high contrast mode
4. Verify reduced motion
5. Test live region announcements

### PWA Testing
1. Install on various devices
2. Test offline mode
3. Verify shortcuts work
4. Check splash screen
5. Test orientation changes

## Next Steps
Continue to Phase 3 for Developer Experience improvements.