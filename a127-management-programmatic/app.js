'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

a127.init(function(config) {
  app.use(a127.middleware(config));
  app.listen(process.env.PORT || 10010);

  console.log('\nHit this URL and the cache will get an entry:\ncurl http://127.0.0.1:10010/weather/kinston,nc');
});