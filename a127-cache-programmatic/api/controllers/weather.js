'use strict';

var request = require('request');

module.exports.get = function(req, res) {

  var city = req.swagger.params.city.value;
  var url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial";

  // get a pointer to the cache service
  var cache = req.a127.resource('mycache');

  // check to make sure we have the pointer
  if (cache) {

    // perform the 'get' with the key of the city parameter value, with the callback
    cache.get(city, function (err, data) {
      if (err) {
        // if there was an error in the cache return 500 for simplicity
        res.status(500).send(err)
      }

      // if there is a cache hit, return the response from the cache
      else if (data) {
        console.log('Cache hit!');
        res.json(data);
      }

      // if there is a cache miss, call the target API
      else {
        console.log('Cache miss!');
        console.log('-+- Executing request: ' + url);

        request.get(url, function (err, response, body) {
          // if the target API fails, return an error
          if (err) {
            res.status(500).send(err)
          }

          else {
            // set the entry in the cache using the response body and the city name
            cache.set(city, body, function (err) {
              if (err) {
                // return an error if the cache fails
                res.status(500).send(err)
              }
              else {
                // return the response to the API caller
                res.send(body);
              }
            });
          }
        });
      }
    });
  }
  // not able to get a pointer to the cache
  else {
    console.log('Cache not found!');
    request.get(url).pipe(res);
  }
};