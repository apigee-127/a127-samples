'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();
var info = require('./config');
var volos = info.volos;

module.exports = app; // for testing

a127.init(function(config) {
  app.use(a127.middleware(config));
  app.listen(process.env.PORT || 10010);
  createApp(config, function(err, app) {
    console.log('try this:\ncurl \'http://127.0.0.1:10010/hello?name=Scott&apiKey='+app.credentials[0].key + "\'");
  });
});

// Use Volos.js management API to create developer and app on Apigee Edge. 
function createApp(config, cb) {

  config.user = config.username; // Management.create expects 'user' parameter in config obj

  var management = volos.Management.create(config);

  management.deleteDeveloper(info.devRequest.email, function() {

    console.log('Creating developer %s', info.devRequest.email);

    management.createDeveloper(info.devRequest , function(err, developer) {
      if (err) { throw err; }

      console.log('Creating application %s for developer %s', info.appRequest.name, developer.id);

      info.appRequest.developerId = developer.id;
      management.createApp(info.appRequest, cb);
    });
  });
}
