'use strict';

var request = require('request');

module.exports.get = function (req, res) {
  var city = req.swagger.params.city.value;
  var url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial";

  console.log('-+- Executing request: ' + url);

  request.get(url, function (err, response, body) {
    if (err) {
      res.status(500).send(err)
    }

    else {
      res.send(body);
    }
  });
};