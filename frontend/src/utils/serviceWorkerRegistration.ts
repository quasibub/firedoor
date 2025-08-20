// Service Worker Registration Utility
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
              // You can show a notification to the user here
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data);
        
        if (event.data.type === 'BACKGROUND_SYNC') {
          console.log('🔄 Background sync message received:', event.data.message);
        }
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('🔔 Notification permission:', permission);
        } catch (error) {
          console.warn('⚠️ Failed to request notification permission:', error);
        }
      }

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  } else {
    console.log('ℹ️ Service Worker not supported in this browser');
  }
};

// Unregister service worker
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('🗑️ Service Worker unregistered');
      }
    } catch (error) {
      console.error('❌ Failed to unregister service worker:', error);
    }
  }
};

// Check if service worker is registered
export const isServiceWorkerRegistered = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      console.error('❌ Failed to check service worker registration:', error);
      return false;
    }
  }
  return false;
};

// Force update of service worker
export const forceServiceWorkerUpdate = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('🔄 Service Worker update forced');
      }
    } catch (error) {
      console.error('❌ Failed to force service worker update:', error);
    }
  }
};

// Request background sync
export const requestBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in (window.ServiceWorkerRegistration.prototype as any)) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('🔄 Background sync requested:', tag);
    } catch (error) {
      console.error('❌ Failed to request background sync:', error);
    }
  } else {
    console.log('ℹ️ Background sync not supported in this browser');
  }
};

// Check if app is installed as PWA
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Install PWA prompt
export const showInstallPrompt = async (): Promise<void> => {
  // This would typically be handled by a browser install prompt
  // For now, we'll just log that it was requested
  console.log('📱 PWA install prompt requested');
};

const serviceWorkerUtils = {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerRegistered,
  forceServiceWorkerUpdate,
  requestBackgroundSync,
  isPWAInstalled,
  showInstallPrompt,
};

export default serviceWorkerUtils;
