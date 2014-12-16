'use strict';

var util = require('util');

module.exports.clearCache = function (req, res) {
  var cache = req.a127.resource('mycache');

  if (cache) {
    cache.clear(function (err) {
      if (err) {
        res.status(500).send(err);
      }
      else {
        res.status(200).send('cache successfully cleared');
      }
    })
  }
  else {
    res.status(500).send('Cache not found');
  }
};


module.exports.get = function (req, res) {
  var cache = req.a127.resource('mycache');

  var key = req.swagger.params.key.value;

  if (cache) {
    cache.get(key, function (err, data) {
      if (err) {
        res.status(500).send(err)
      }

      else if (data) {
        console.log('Manual Cache hit!');
        res.send(data);
      }

      else {
        res.status(404).send('Key [' + key + '] not found');
      }
    });
  }
  else {
    res.status(500).send('cache not found');
  }
};

module.exports.delete = function (req, res) {
  var cache = req.a127.resource('mycache');

  var key = req.swagger.params.key.value;

  if (cache) {
    cache.delete(key, function (err, data) {
      if (err) {
        res.status(500).send(err)
      }
      else if (data) {
        console.log('Deleted value for key=' + key + '!');
        res.json(data);
      }
      else {
        res.status(404).send('not found');
      }
    });
  }
  else {
    console.log('Cache not found!');
    res.status(500).send('cache not found');
  }
};
