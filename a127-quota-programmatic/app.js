'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

// uncomment the following if you need to parse incoming form data
//app.use(express.bodyParser());

app.use(a127.middleware());

app.listen(process.env.PORT || 10010);

console.log('\nHit this URL and the quota counter will go up:\ncurl http://localhost:10010/weather/kinston,nc');

console.log('\nHit URL to increment the quota counter:\ncurl http://localhost:10010/cache/kinston,nc');

console.log('\nHit URL to reset the quota for a key:\ncurl -X DELETE http://localhost:10010/cache/kinston,nc');