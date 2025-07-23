// Enhanced Service Worker for Claude Code UI PWA
const CACHE_NAME = 'claude-ui-v2.0.0';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resource type to strategy mapping
const RESOURCE_STRATEGIES = {
  'text/html': CACHE_STRATEGIES.NETWORK_FIRST,
  'text/css': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  'application/javascript': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  'image/': CACHE_STRATEGIES.CACHE_FIRST,
  'font/': CACHE_STRATEGIES.CACHE_FIRST,
  'application/json': CACHE_STRATEGIES.NETWORK_FIRST
};

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
    })
  );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extensions and other schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip API calls (let them go to network)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle requests based on resource type
async function handleRequest(request) {
  const url = new URL(request.url);
  const contentType = getContentType(url.pathname);
  const strategy = getStrategy(contentType);
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request);
      
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request);
      
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request);
      
      case CACHE_STRATEGIES.NETWORK_ONLY:
        return await fetch(request);
      
      case CACHE_STRATEGIES.CACHE_ONLY:
        return await caches.match(request);
      
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('[SW] Request failed:', error);
    return await handleOffline(request);
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  // Cache successful responses
  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Start fetch in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
      return networkResponse.clone();
    }
    return networkResponse;
  });
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Return cached version if available
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return a basic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

// Get content type from URL
function getContentType(pathname) {
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
    case 'mjs':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'image/';
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'otf':
      return 'font/';
    default:
      return 'text/html'; // Default for navigation
  }
}

// Get caching strategy for content type
function getStrategy(contentType) {
  for (const [type, strategy] of Object.entries(RESOURCE_STRATEGIES)) {
    if (contentType.startsWith(type)) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    
    case 'CLEAR_CACHE':
      clearCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Clear all caches
async function clearCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync');
  // Add background sync logic here
}

// Push notification handler
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Open App'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('Claude Code UI', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker script loaded');