/**
 * Common database helper functions.
 */
class DBHelper {
	
	static get DATABASE_URL() {
    const port = 1337
    return `http://localhost:${port}/`;
  }

  static dbPromise() {
    return idb.open('db', 2, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
      }
    });
  }
	
  /**
   * Fetch all restaurants.
   */

	static fetchRestaurants(callback) {
		const request = indexedDB.open("Restaurants");
		let dbExists = false;
		
		request.onupgradeneeded = function() {
			const db = request.result;
			console.log('db upgraded');
		}
		
		request.onerror = function(event){
			console.log('db error: ', event);
		}
		
		request.onsuccess = function(event) {
			const db = request.result;
			
			if (db.version === 0 && db.length >= 1){
				dbExists = false;
			} else {
				dbExists = true;
			}
			
			if (dbExists){
				const	tx = db.transaction('restStore', 'readwrite'),
							store = tx.objectStore('restStore'),
							storeRequest = store.getAll();
				
				storeRequest.onsuccess = function(event){
					const restaurants = storeRequest.result;
					callback(null, restaurants);
				}
			} else {
				fetch('http://localhost:1337/restaurants')
				.then((response) => response.json())
				.then((response) => {
					const restaurants = response;
					callback(null, restaurants);
				}).catch(error => {
					console.log('Error retrieving restaurants', error);
				});
			}
		}
	}
	
	static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
	
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    })
    marker.addTo(newMap);
    return marker;
  }
	
	static dbPromise() {
		return idb.open('db', 2, function(upgradeDb){
			switch (upgradeDb.oldVersion){
				case 0:
					upgradeDb.createObjectStore('restaurants', {
						keyPath: 'id'
					});
				case 1:
					const reviewStore = upgradeDb.createObjectStore('reviews', {
						keyPath: 'id'
					});
				reviewStore.createIndex('restaurant', 'restaurant_id');
			}
		});
	}
	
	static fetchAndCacheRestaurants(){
		return fetch('http://localhost:1337/restaurants').then(response => response.json()).then(restaurants => {
			return this.dbPromise().then(db => {
				const tx = db.transaction('resataurants', 'readwrite'),
							restaurantStore = tx.objectStore('restaurants');
				restaurants.forEach(restaurant => restaurantStore.put(restaurant));
				return tx.complete.then(() => Promise.resolve(restaurants));
			});
		});
	}
	
	static updatefavoriteStatus(restaurantId, isfavorite) {
    console.log('changing status to: ', isfavorite);
    fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isfavorite}`, {
        method: 'PUT'
      })
      .then(() => {
        console.log('changed');
        this.dbPromise()
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantsStore = tx.objectStore('restaurants');
            restaurantsStore.get(restaurantId)
              .then((restaurant) => {
                restaurant.is_favorite = isfavorite;
                restaurantsStore.put(restaurant);
              });
          });
      });
  }
	
	static fetchReviewsByRestId(id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        this.dbPromise()
          .then(db => {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            if (Array.isArray(reviews)) {
              reviews.forEach(function(review) {
                store.put(review);
              });
            } else {
              store.put(reviews);
            }
          });
        return Promise.resolve(reviews);
      })
      .catch(error => {
        return DBHelper.getStoredObjectById('reviews', 'restaurant', id)
          .then((storedReviews) => {
            console.log('looking for offline stored reviews');
            return Promise.resolve(storedReviews);
          })
      });
  }
	
	static storeIndexedDB(table, objects) {
    this.dbPromise.then(function(db) {
      if (!db) return;
      let tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      if (Array.isArray(objects)) {
        objects.forEach(function(object) {
          store.put(object);
        });
      } else {
        store.put(objects);
      }
    });
  }
	
 	static getStoredObjectById(table, idx, id) {
    return this.dbPromise()
      .then(function(db) {
        if (!db) return;
        const store = db.transaction(table).objectStore(table);
        const indexId = store.index(idx);
        return indexId.getAll(id);
      });
  }
	
	static addReview(review) {
    let offline_obj = {
      name: 'addReview',
      data: review,
      object_type: 'review'
    };
    if (!navigator.onLine && (offline_obj.name === 'addReview')) {
      DBHelper.sendDataWhenOnline(offline_obj);
      return;
    }
    let reviewSend = {
      "name": review.name,
      "rating": parseInt(review.rating),
      "comments": review.comments,
      "restaurant_id": parseInt(review.restaurant_id)
    };
    console.log('Sending review: ', reviewSend);
    var fetch_options = {
      method: 'POST',
      body: JSON.stringify(reviewSend),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
    fetch(`http://localhost:1337/reviews`, fetch_options).then((response) => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      } else { return 'API call successfull'}})
    .then((data) => {console.log(`Fetch successful!`)})
    .catch(error => console.log('error:', error));
  }
	
	  static sendDataWhenOnline(offline_obj) {
    console.log('Offline OBJ', offline_obj);
    localStorage.setItem('data', JSON.stringify(offline_obj.data));
    console.log(`Local Storage: ${offline_obj.object_type} stored`);
    window.addEventListener('online', (event) => {
      console.log('Browser: Online again!');
      let data = JSON.parse(localStorage.getItem('data'));
      console.log('updating and cleaning ui');
      [...document.querySelectorAll(".reviews_offline")]
      .forEach(el => {
        el.classList.remove("reviews_offline")
        el.querySelector(".offline_label").remove()
      });
      if (data !== null) {
        console.log(data);
        if (offline_obj.name === 'addReview') {
          DBHelper.addReview(offline_obj.data);
        }

        console.log('LocalState: data sent to api');

        localStorage.removeItem('data');
        console.log(`Local Storage: ${offline_obj.object_type} removed`);
      }
    });
  }
}
