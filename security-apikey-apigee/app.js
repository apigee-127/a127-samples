'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();
var config = require('./config');
var volos = config.volos;
var management = volos.Management.create(config.apigee);

module.exports = app; // for testing

a127.init(function(config) {

  app.use(a127.middleware(config));
  app.listen(process.env.PORT || 10010);
  createApp(management, function(err, app) {
    console.log('try this:\ncurl \'http://127.0.0.1:10010/hello?name=Scott&apiKey='+app.credentials[0].key + "\'");
  });
});


function createApp(management, cb) {

  management.deleteDeveloper(config.devRequest.email, function() {

    console.log('Creating developer %s', config.devRequest.email);

    management.createDeveloper(config.devRequest , function(err, developer) {
      if (err) { throw err; }

      console.log('Creating application %s for developer %s', config.appRequest.name, developer.id);

      config.appRequest.developerId = developer.id;
      management.createApp(config.appRequest, cb);
    });
  });
}
