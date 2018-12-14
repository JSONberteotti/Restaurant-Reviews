const express = require('express'),
      app = express(),
      path = require('path');

app.use("/", express.static(__dirname + '/'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/img", express.static(__dirname + '/img'));
app.use("/data", express.static(__dirname + '/data'));
app.use("/js", express.static(__dirname + '/js'));

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/restaurant.html', function(req, res) {
	res.sendFile(path.join(__dirname + '/restaurant.html'));
});

app.get('/data/restaurants.json', function(req, res) {
	res.sendFile(path.join(__dirname + '/restaurants.json'));
});

app.listen(8000);
console.log('Now listening on port 8000');