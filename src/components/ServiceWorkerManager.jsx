import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

/**
 * ServiceWorkerManager Component
 * 
 * Manages service worker registration, updates, and provides PWA functionality
 * including offline support, caching strategies, and update notifications.
 * 
 * Features:
 * - Automatic service worker registration
 * - Update detection and notification
 * - Offline status monitoring
 * - Cache management
 * - Background sync capabilities
 * - User-friendly update prompts
 */

const ServiceWorkerManager = ({
  onUpdate,
  onOfflineReady,
  enableAutoUpdate = false,
  enableNotifications = true,
  className = '',
  ...props
}) => {
  const [swState, setSwState] = useState({
    isInstalled: false,
    isWaiting: false,
    isOfflineReady: false,
    hasUpdate: false,
    isOnline: navigator.onLine
  });
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Monitor online/offline status
    const handleOnline = () => setSwState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSwState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);

      // Handle service worker states
      if (reg.installing) {
        trackInstalling(reg.installing);
      } else if (reg.waiting) {
        setSwState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
        if (enableNotifications) {
          setShowUpdatePrompt(true);
        }
      } else if (reg.active) {
        setSwState(prev => ({ ...prev, isInstalled: true, isOfflineReady: true }));
        onOfflineReady?.();
      }

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        trackInstalling(reg.installing);
      });

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  const trackInstalling = (worker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Update available
          setSwState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
          if (enableNotifications) {
            setShowUpdatePrompt(true);
          }
          onUpdate?.();
        } else {
          // First install
          setSwState(prev => ({ ...prev, isInstalled: true, isOfflineReady: true }));
          onOfflineReady?.();
        }
      }
    });
  };

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Auto-update if enabled
  useEffect(() => {
    if (enableAutoUpdate && swState.hasUpdate) {
      setTimeout(updateServiceWorker, 3000); // Auto-update after 3 seconds
    }
  }, [swState.hasUpdate, enableAutoUpdate]);

  // Update prompt component
  const UpdatePrompt = () => {
    if (!showUpdatePrompt) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-sm text-foreground">Update Available</h3>
            <p className="text-xs text-muted-foreground mt-1">
              A new version of the app is ready. Reload to get the latest features.
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={updateServiceWorker}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={dismissUpdate}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={dismissUpdate}
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Offline indicator
  const OfflineIndicator = () => {
    if (swState.isOnline) return null;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="font-medium text-yellow-800 dark:text-yellow-200">
            You're offline
          </span>
          <span className="text-yellow-600 dark:text-yellow-300">
            - Some features may be limited
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <UpdatePrompt />
      <OfflineIndicator />
    </>
  );
};

/**
 * PWA Install Prompt Component
 * 
 * Detects if the app can be installed as a PWA and shows install prompt
 */
export const PWAInstallPrompt = ({
  className = '',
  ...props
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (isInstalled || !showInstallPrompt) return null;

  return (
    <div className={cn("fixed bottom-4 left-4 z-50 max-w-sm bg-card border border-border rounded-lg shadow-lg p-4", className)} {...props}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-sm text-foreground">Install App</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install Claude Code UI for quick access and offline use
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        <button
          onClick={dismissInstallPrompt}
          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * Service Worker Status Hook
 * 
 * Hook to get service worker status in other components
 */
export const useServiceWorker = () => {
  const [status, setStatus] = useState({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isWaiting: false,
    isOnline: navigator.onLine
  });

  useEffect(() => {
    if (!status.isSupported) return;

    const checkRegistration = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      setStatus(prev => ({
        ...prev,
        isRegistered: !!registration,
        isWaiting: !!registration?.waiting
      }));
    };

    checkRegistration();

    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status.isSupported]);

  return status;
};

export default ServiceWorkerManager;