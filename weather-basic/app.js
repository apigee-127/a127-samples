'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

a127.init(function(config) {
  app.use(a127.middleware(config));
  app.listen(process.env.PORT || 10010);

  console.log('try this:\nhttp://127.0.0.1:10010/weather?city=Kinston,NC');
});