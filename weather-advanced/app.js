'use strict';

var a127 = require('a127-magic');
var oauth = a127.resource('oauth2');
var express = require('express');
var app = express();

var Management = require('volos-management-apigee');
var OAuth = require('volos-oauth-apigee');

var volos = {
  Management: Management,
  OAuth: OAuth
};

// uncomment the following if you need to parse incoming form data
//app.use(express.bodyParser());

app.use(a127.middleware());
app.get('/authorize', oauth.expressMiddleware().handleAuthorize());
app.post('/accesstoken', oauth.expressMiddleware().handleAccessToken());
app.post('/invalidate', oauth.expressMiddleware().invalidateToken());
app.post('/refresh', oauth.expressMiddleware().refreshToken());

var PORT = process.env.PORT || 10010
app.listen(PORT);

/**** OAuth ****/
var config = require('./config');

/**** OAuth ****/

var management = volos.Management.create(config.apigee);

function createToken(management, oauth, cb) {

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


function printHelp() {

  createToken(management, oauth, function(err, creds) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return;
    }

    console.log('listening on %d', PORT);

    console.log('\nexample curl commands:\n');

    console.log('Get a Client Credential Token:');
    console.log('curl -X POST "http://localhost:%s/accesstoken" -d ' +
      '"grant_type=client_credentials&client_id=%s&client_secret=%s"\n',
      PORT, encodeURIComponent(creds.clientId), encodeURIComponent(creds.clientSecret));

    console.log('Weather Lookup:');
    console.log('curl -H "Authorization: Bearer %s" "http://localhost:%s/weather?city=Kinston,NC"\n',
      creds.accessToken, PORT);
  });
}


printHelp();

console.log('try this:\ncurl http://localhost:10010/weather?city=Kinston,NC');
