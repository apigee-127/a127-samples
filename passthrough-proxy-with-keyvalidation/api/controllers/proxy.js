'use strict';

var request = require('request');
var debug = require('debug')('proxy');
var prefixRegExp;

module.exports.proxy = function proxy(req, res, next) {

  // calculate and cache RegExp for best performance
  if (!prefixRegExp) { prefixRegExp = new RegExp('^' + req.swagger.apiPath); }

  verifyAPIKey(req, function(err) {
    if (err) { return next(err); }

    // calculate proxy URL
    var basePath = req.a127.config('proxyBase');
    var subPath = req.url.replace(prefixRegExp, ''); // use subpath of the swagger path
    var proxyUrl = basePath + subPath;

    debug('proxying to: %s', proxyUrl);
    req.pipe(request(proxyUrl)).pipe(res); // proxy all data (headers, query, body)
  });

};

function verifyAPIKey(req, next) {
  var cm = require('volos-cache-memory');
  var cache = cm.create('name', { ttl: 100000 }); // specifies default ttl as 1000 ms
  var oauth = req.a127.resource('oauth');
  var apiKey = req.swagger.params.api_key.value;


  cache.get(apiKey, function(error, cachedValue){
    if(cachedValue)
    {
      next();
    }
    else
    {
      oauth.verifyApiKey(apiKey, function(err) {
        if (err) {
          debug('error: %j', err);
          // only return error to client on invalid key
          if (err.code === 'oauth.v2.InvalidApiKey') {
            return next(err);
          }
        }
        else
        {
          console.log(apiKey);
          cache.set(apiKey,apiKey, function(error){
            next();
          });       
        }   
      });      
    }
  });
}
