'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

a127.init(function(config) {
  app.use(a127.middleware(config));

  app.listen(process.env.PORT || 10010);

  console.log('\nHit this URL and the quota counter will go up:\ncurl http://127.0.0.1:10010/weather/kinston,nc');

  console.log('\nHit URL to increment the quota counter:\ncurl http://127.0.0.1:10010/cache/kinston,nc');

  console.log('\nHit URL to reset the quota for a key:\ncurl -X DELETE http://127.0.0.1:10010/cache/kinston,nc');
});