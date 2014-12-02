'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

// uncomment the following if you need to parse incoming form data
app.use(express.bodyParser());

app.use(a127.middleware());

app.listen(process.env.PORT || 10010);

console.log('try this:\nhttp://localhost:10010/weather?city=Kinston,NC');

/*
var ManagementProvider = require('volos-management-redis');
var config = {
  encryptionKey : "abc123",
};
var management = ManagementProvider.create(config);

function createDev(cb) {
  var devRequest =  {
    firstName: 'Scott',
    lastName: 'Ganyo',
    email: 'sganyo@apigee.com',
    userName: 'sganyo'
  };

  management.createDeveloper(devRequest, cb);
}

function createApp(developer, cb) {
  var appRequest = {
    developerId : developer.id,
    name: 'MyApplication',
    scopes: 'scope1 scope2'
  };
  management.createApp(appRequest, cb);
}

createDev(function(e, developer) {
  console.log(JSON.stringify(developer));
  createApp(developer, function(e, result) {
    console.log("APP: " + JSON.stringify(result));
  });
});
*/
