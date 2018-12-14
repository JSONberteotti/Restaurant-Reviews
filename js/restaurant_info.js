let restaurant;
var map;

window.onload = function(){
  initMap();
}

/**
 * Initialize map, called from HTML.
 */
initMap = () => {
  fetchRestaurantFromURL(restaurant => {
		self.newMap = L.map('mapid', {
		center: [40.722216, -73.987501],
		zoom: 16,
		scrollWheelZoom: false
	});
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
		mapboxToken: 'pk.eyJ1Ijoibmlzc2hva3UxOTgwIiwiYSI6ImNqa3lzd2s4bjBneTAzcG53dmdhOTk0cnIifQ.mVw-_519Jv8DSlnG4jdUTQ',
		maxZoom: 18,
		attribution: '',
		id: 'mapbox.streets'
	}).addTo(newMap);
		DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
	});
}
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
   // callback(null, self.restaurant)
   // return;
		return Promise.resolve(self.restaurant);
  }
  const id = parseInt(getParameterByName('id'));
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  const picture = document.getElementById('restaurant-img');
  picture.className = 'restaurant-img';
  
  const sourceLrg = document.createElement('source');
  sourceLrg.media = '(min-width: 800px)';
  sourceLrg.srcset = imgUrl + '-1600x2.jpg 2x, ' + imgUrl + '-800-large.jpg';
  picture.append(sourceLrg);
  
  const sourceMed = document.createElement('source');
  sourceMed.media = '(min-width: 500px)';
  sourceMed.srcset = imgUrl + '-500-medium.jpg';
  picture.append(sourceMed);
  
  const image = document.createElement('img');
  image.src = imgUrl + "-350-small.jpg";
  image.setAttribute('alt', restaurant.description);
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsByRestId(restaurant.id)
      .then(reviews => fillReviewsHTML(reviews))
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  if (!navigator.onLine) {
    const connection_status = document.createElement('p');
    connection_status.classList.add('offline_label')
    connection_status.innerHTML = "Offline"
    li.classList.add("reviews_offline")
    li.appendChild(connection_status);
  }
  const name = document.createElement('p');
  name.innerHTML = `Name: ${review.name}`;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = `Date: ${new Date(review.createdAt).toLocaleString()}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  return li;
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Review Submission
 */
addReview = () => {
    event.preventDefault();
    // Get form data
    let restaurantId = getParameterByName('id');
    let name = document.getElementById('review-author').value;
    let rating;
    let comments = document.getElementById('review-comments').value;
    rating = document.querySelector('#rating_select option:checked').value;
    const review = [name, rating, comments, restaurantId];
    // Add to DOM
    const frontEndReview = {
        restaurant_id: parseInt(review[3]),
        rating: parseInt(review[1]),
        name: review[0],
        comments: review[2].substring(0, 300),
        createdAt: new Date()
    };
    // Send review
    DBHelper.addReview(frontEndReview);
    addReviewHTML(frontEndReview);
    document.getElementById('review-form').reset();
}

addReviewHTML = (review) => {
    if (document.getElementById('no-review')) {
        document.getElementById('no-review').remove();
    }
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');

    ul.insertBefore(createReviewHTML(review), ul.firstChild);
    container.appendChild(ul);
}