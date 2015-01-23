'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

var config = require('./config/config.js');

var ManagementProvider = require('volos-management-redis');
var key = {
  encryptionKey : "abc123",
};
var management = ManagementProvider.create(key);

function createDev(cb) {
  management.createDeveloper(config.devRequest, cb); 
}

function createApp(developer, cb) {
  var appRequest = {
    developerId : developer.id,
    name: config.appRequest.name,
    scopes: config.appRequest.scopes
  };

  management.createApp(appRequest, cb);
}

createDev(function(e, developer) {
  console.log("THE DEVELOPER: " + JSON.stringify(developer) + "\n");
  createApp(developer, function(e, result) {
    console.log("THE APP: " + JSON.stringify(result) + "\n");
    console.log("Client ID: " + result.credentials[0].key + "\n");
    console.log("Client Secret: " + result.credentials[0].secret + "\n");
    var key = encodeURIComponent(result.credentials[0].key);
    var secret = encodeURIComponent(result.credentials[0].secret);
    console.log("Obtain access token:  curl -i -X POST http://127.0.0.1:10010/accesstoken -d 'grant_type=client_credentials&client_id=" + key + "&client_secret=" + secret + "'");
    process.exit();
  });
});

