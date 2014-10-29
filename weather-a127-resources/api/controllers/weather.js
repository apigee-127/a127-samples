'use strict';

var util = require('util');
var request = require('request');

module.exports = {
  getWeatherByCity: getWeatherByCity
};

function getWeatherByCity(req, res) {
  var cache = req.a127.resource('mycache');

  var city = req.swagger.params.city.value;
  var url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial";

  console.log('Executing request: ' + url);

  cache.get(city, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }

    else if (data) {
      res.json(data);
    }

    else {
      request.get(url, function (err, response, body) {
        if (err) {
          res.status(500).send(err)
        }

        else {
          cache.set(city, body, function (err, data) {
            if (err) {
              res.status(500).send(err)
            }

            else {
              res.send(data);
            }
          });
        }
      });
    }
  });
}
