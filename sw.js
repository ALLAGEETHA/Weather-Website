// Weather App Service Worker
const CACHE_NAME = 'weather-app-v1.0.0';
const STATIC_CACHE = 'weather-static-v1.0.0';
const DYNAMIC_CACHE = 'weather-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.svg',
  'https://cdn.tailwindcss.com'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.hostname === 'api.openweathermap.org') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response for caching
          const responseClone = response.clone();
          
          // Cache successful API responses
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return offline page or error response
              return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'No internet connection. Please check your network and try again.'
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static files with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseClone = response.clone();
            
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Return a custom offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Background sync for weather data
self.addEventListener('sync', (event) => {
  if (event.tag === 'weather-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // This would sync weather data when connection is restored
      syncWeatherData()
    );
  }
});

// Push notifications (for future weather alerts)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Weather',
          icon: '/icons/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192x192.svg'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function syncWeatherData() {
  try {
    // This would implement background weather data sync
    console.log('Service Worker: Syncing weather data...');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}
