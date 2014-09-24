'use strict';

var a127 = require('a127-magic');
var express = require('express');
var app = express();

// uncomment the following if you need to parse incoming form data
//app.use(express.bodyParser());

app.use(a127.middleware());
var PORT = process.env.PORT || 10010;

app.listen(process.env.PORT || 10010);
  var config = require('./config');

function printHelp() {

  var config = require('./config');
  var volos = config.volos;
  var management = volos.Management.create(config.apigee);
  var oauth = a127.resource('oauth2');

  createToken(management, oauth, config, function(err, creds) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return;
    }


    console.log('listening on port %d', PORT);
    
    console.log('\nExample curl commands:\n');    
		console.log('---------');
		console.log('Direct Proxy:');
		console.log('curl http://localhost:%s/weather?city=Kinston,NC',PORT);

		console.log('---------');
		console.log('try this Cached call (10s TTL):');
		console.log('curl http://localhost:%s/weather_cached?city=Kinston,NC',PORT);

		console.log('---------');
		console.log('try this call which has a 2-per minute Quota:');
		console.log('curl http://localhost:%s/weather_quota?city=Kinston,NC',PORT);

		console.log('---------');
    console.log('Get a Client Credential Token:');
    console.log('curl -X POST "http://localhost:%s/accesstoken" -d ' +
      '"grant_type=client_credentials&client_id=%s&client_secret=%s"\n',
      PORT, encodeURIComponent(creds.clientId), encodeURIComponent(creds.clientSecret));

    console.log('Weather Lookup:');
    console.log('curl -H "Authorization: Bearer %s" "http://localhost:%s/weather_secure?city=Kinston,NC"\n',
      creds.accessToken, PORT);
  });
}

function createToken(management, oauth, config, cb) {

  management.getDeveloperApp(config.devRequest.userName, config.appRequest.name, function(err, app) {
    if (err) { cb(err); }

    var tokenRequest = {
      clientId: app.credentials[0].key,
      clientSecret: app.credentials[0].secret
    };

    oauth.spi.createTokenClientCredentials(tokenRequest, function(err, result) {
      if (err) { cb(err); }

      var accessToken = result.access_token;

      console.log('Client ID: %s', app.credentials[0].key);
      console.log('Client Secret: %s', app.credentials[0].secret);
      console.log('Access Token: %s', accessToken);

      tokenRequest.accessToken = accessToken;

      cb(null, tokenRequest);
    });
  });
}
printHelp();

