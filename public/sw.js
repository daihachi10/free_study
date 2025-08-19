self.addEventListener('install', (event) => {
  console.log('Service Worker: A new version is installing...');
  // Skip waiting to activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating new version...');
  // Take control of all clients immediately.
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This is a basic fetch handler. 
  // It doesn't provide offline functionality as requested.
  // It just responds with the network request.
  event.respondWith(fetch(event.request));
});
