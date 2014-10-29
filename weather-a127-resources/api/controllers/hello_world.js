'use strict';

var util = require('util');

module.exports = {
  get: hello
};

function hello(req, res) {
  var name = req.swagger.params.name.value;

  if (!name) {
    name = 'stranger';
  }

  var cache = req.a127.resource('mycache');

  cache.get(name, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }

    else if (data) {
      res.json(util.format('Hello, %s - CACHEMASTER!  Cache Value: %s', name, data));
    }
    else {
      cache.set(name, 'foobar', function (err, data) {
        if (err) {
          res.status(500).send(err)
        }
        else {
          res.json(util.format('Hello, %s!', data));
        }
      });
    }
  });
}
