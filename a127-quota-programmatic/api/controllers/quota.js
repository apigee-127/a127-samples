'use strict';

module.exports.delete = function (req, res) {
  var cache = req.a127.resource('myquota');

  if (cache) {
    cache.clear(function (err) {
      if (err) {
        res.status(500).send(err);
      }
      else {
        res.status(200).send('quota successfully reset');
      }
    })
  }
  else {
    res.status(500).send('service not found');
  }
};


module.exports.get = function (req, res) {
  var cache = req.a127.resource('myquota');

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
    res.status(500).send('service not found');
  }
};