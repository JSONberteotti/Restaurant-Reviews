const cacheName = 'reviews-v1',
			precache = [
				'/',
				'/restaurant.html',
				'/css/styles.css',
				'/js/main.js',
				'/js/restaurant_info.js',
				'/js/dbhelper.js',
				'/app-manifest.json',
				'/img/1-500-medium.jpg',
				'/img/2-500-medium.jpg',
				'/img/3-500-medium.jpg',
				'/img/4-500-medium.jpg',
				'/img/5-500-medium.jpg',
				'/img/6-500-medium.jpg',
				'/img/7-500-medium.jpg',
				'/img/8-500-medium.jpg',
				'/img/9-500-medium.jpg',
				'/img/10-500-medium.jpg'
			];

// Cache files.

self.addEventListener('install', event => {
  console.log('Service worker installing');
  event.waitUntil(
    caches.open(cacheName)
    .then(cache => cache.addAll(precache)
		).then(() => {
			console.log('Service worker installed');
		}));
});

// Intercept fetch requests.

self.addEventListener('fetch', event => {  
  if (event.request.method !== 'GET'){
    return;
  }
	
  // Respond from cache and check for a fresh response.

  event.respondWith(
    caches.match(event.request)
    .then(cached => {
      const networked = fetch(event.request)
      .then(fetchedFromNetwork, unableToResolve)
      .catch(unableToResolve);
      return cached || networked;

      function fetchedFromNetwork(response){
        const cacheCopy = response.clone();

        // Cache new response.

        caches.open(cacheName + 'pages')
        .then(function add(cache){
          cache.put(event.request, cacheCopy);
        });
        return response;
      }
      
      // Handle failure on both requests.
      
      function unableToResolve(){
        return new Response('<h1>Service Unavailable</h1>', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/html'
          })
        });
      }
    })
  );
});