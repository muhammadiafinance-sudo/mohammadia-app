/* Minimal service worker: satisfies Chrome's install criteria.
   It does NOT cache anything, so every open loads the latest deployed
   version (no stale-app problem). */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){e.respondWith(fetch(e.request))});
