# OAuth password grant type example

* [What is this?](#whatisthis)
* [How it works?](#whatis)
* [How do I get it?](#howdo)
* [Use Apigee as the provider](#apigeeprovider)
* [Use Redis as the provider](#apigeeprovider)
* [Extra credit: Using a refresh token](#refreshtoken)

## <a name="whatisthis"></a>What is this?

In this Apigee-127 example, we show you how to:

* Add OAuth security to an Apigee-127 API using the OAuth 2.0 resource owner password credentials (password) grant type. 

* Obtain an access token with the password grant type. In the first part of the example, we'll use Apigee Edge as the "authorization server" and then we'll show you how to use Redis running locally.

* Call the secured API with the access token.

* Use a refresh token.


> If you are not familiar with OAuth 2.0 and terms like grant type and authorization server, there are many resources available on the web. We recommend you start with the [IETF specification](https://tools.ietf.org/html/draft-ietf-oauth-v2-31). It includes a good, general introduction to the OAuth 2.0 framework and its use cases.

## <a name="whatis">How it works

The OAuth 2.0 password grant type requires the client app to provide the resource owner's username/password when requesting an access token. 

>Note: This flow should only be used for highly trusted client apps, because the client app has direct access to the user's credentials. However, the credentials are only used once in a single request, and they are exchanged for an access token, which is used for all subsequent requests.

A client app must also supply its client ID and client secret keys when requesting an access token. These keys are generated when a client app is registered with the authorization server. For example, if your OAuth provider is Apigee, then the app must be registered on Apigee Edge. App registration is always required whenever you use OAuth. We'll walk through the steps in this example.

The password grant type flow we'll see in this example looks like this: 

![alt text](../images/oauth-password-flow.png)

1. The client app requests an access token, providing a username/password (typically entered by the end user into a form provided by the client app), client ID, and client secret (obtained during client app registration). 
2. Apigee-127 receives the request and checks the username/password by calling the `passwordCheck()` helper function.
3. If the credentials are valid, and if the `client_id` and `client_secret` are valid, an access token is minted. If you're using the Apigee provider for your OAuth, then a call is made to Apigee Edge for the token. If Redis is the provider, then Apigee-127 generates the token. 
4. The token is returned to the client app.
5. The client app uses the token to make API calls on protected paths. For example, if the `/weather` path is protected, the call will proceed if a valid access token is provided. Otherwise, the call will fail. 

## <a name="howdo"></a>How do I get it?

#### 1) Clone this repository from Git
```bash 
  $ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
  $ cd a127-samples/oauth-password-example
  $ npm install
```

Now that you have things installed, let's run through the example. First, we'll use Apigee Edge as the OAuth provider.

## <a name="apigeeprovider"></a>Use Apigee as the OAuth provider

In this part, we'll secure the example API with OAuth and use Apigee Edge as the OAuth provider (the authorization server in OAuth terminology). This means that Apigee-127 will call a service deployed on Apigee Edge to generate and verify access tokens. 

### Create an Apigee-127 account

If you haven't done so, create an Apigee-127 account, and select `apigee` as the Provider:

```sh
  $ a127 account create foo
  [?] Provider? 
    amazon 
  ❯ apigee 
    local 
```

Follow the prompts, entering your Apigee account information. 

> When you select Apigee as the account provider, an API proxy called `apigee-remote-proxy` is automatically deployed to your Apigee Edge organization. This proxy implements the OAuth endpoints needed to get access tokens, refresh tokens, and so on. In addition, you'll get a configured developer app called "Remote Proxy" that includes client ID and secret keys that are required when requesting tokens.

Be sure this Apigee account is selected (is the currently active account):

`$ a127 account select foo`

### Examine the OAuth provider configuration in the Swagger editor

By default, the example is configured to use Apigee Edge as the OAuth 2.0 provider (authorization server).

In a terminal window, cd to the root of the example project `./oauth-password-example`, and start the Swagger editor:

`a127 project edit`

Notice in the `x-volos-resources section` there's a resource called `oauth2`, and that `volos-oauth-apigee` provider is uncommented. The only other option is a Redis implementation. We'll look at that one later in this example.


```` yaml
  x-volos-resources:
    oauth2:
      provider: "volos-oauth-apigee"
      #provider: "volos-oauth-redis"
      options:
        ## Needed for Apigee provider
        key: *apigeeProxyKey
        uri: *apigeeProxyUri
        ## Needed for Redis provider
        encryptionKey: 'abc123'
        host: '127.0.0.1'
        port: 6379
        ## Apply to both providers
        tokenLifetime: 300000
        passwordCheck:
          helper: volos
          function: passwordCheck
        validGrantTypes:
          - password
        tokenPaths:  # These will be added to your paths section for you
          token: /accesstoken
          refresh: /refresh
          invalidate: /invalidate
````

Here's a quick description of the oauth2 configuration:

* `provider` -- The authorization server implementation -- either Apigee or Redis. 
* `key` -- The client ID that is used to authenticate access to the `apigee-remote-proxy` services. This key references a value that was automatically generated when you created your account. It's stored with your account metadata. 
* `uri` -- The URI for the `apigee-remote-proxy` deployed on Apigee Edge. Also generated with your account.
* `encryptionKey` -- A key used by the Redis provider to generate encrypted tokens.
* `host` -- The host where the Redis server is running.
* `port` -- The port where the Redis server is listening.
* `tokenLifetime` -- The life span of an access token in milliseconds.
* `passwordCheck` -- REQUIRED for the password grant type. This element specifies a helper file (`./api/helpers/volos.js`) and a function that validates the username and password of the resource owner. In a production environment, this helper function would implement the appropriate credential checking mechanism, such as validating against an LDAP repository or other user store. See [Implementing the passwordCheck function](#helperfunction). 
* `validGrantTypes` -- The OAuth 2.0 grant types the authorization server can handle. In this example, we're focusing on the password grant type.
* `tokenPaths` -- The paths that resolve to token endpoints on the authorization server. The endpoints generate access tokens and allow you to invalidate tokens. You can also use a refresh token to obtain a new access token.

### Add OAuth security to API paths

The example is set up with OAuth security on the `/weather` path of the API. You can protect any path in your API simply by adding the same `x-volos-authorizations` reference to it. Here's what it looks like in the example's Swagger file: 

````yaml
  paths:
    /weather:
      x-swagger-router-controller: weather
     x-volos-authorizations:
         oauth2: {}
````

That's it. We've configured an OAuth provider and added OAuth 2.0 security to the `/weather` path by configuring the Swagger file. The `/weather` path will only execute if the request has a valid access token, as we'll see next.

### Call the API

In a terminal window, cd to the root of the example project `./oauth-password-example`. Start the example project:

`a127 project start`

Let's see what happens when you call the API without an access token:

`curl -i "http://localhost:10010/weather?city=Kinston,NC"`

As expected, you get an error. The good news is that if you get this error, you know that the security scheme is working!

`{"error_description":"Missing Authorization header","error":"missing_authorization"}`

Next, we'll get that access token and call the API properly.

### <a name="getcreds"></a>Obtaining the client credentials

Remember that whenever an app uses OAuth, that app must be registered with an authorization server. It is through registration that the app receives its client credentials: a client ID and a client secret. These credentials allow the authorization server to uniquely identify the app. 

For this example, the simplest way to get a usable set of client credentials is from the default developer app that was provisioned when you created your Apigee-127 account. 

1. Log in to your Apigee Edge account. 
2. From the main menu, select **Publish > Developer** apps.
3. In the list of apps, locate the one called **Remote Proxy**. 
4. In the Remote Proxy page, locate the Remote Proxy product and click **Show** next to the Consumer Key and Consumer Secret fields. 
5. Save those values, you'll need them to request an access token.

>Note: The Apigee UI refers to Consumer Key and Consumer Secret. Note that Consumer Key is equivalent to client ID and Consumer Secret is equivalent to client secret. 

### <a name="helperfunction"></a>Implementing the password check function

If you use the password grant type, you  **must** include the `passwordCheck` element in the `x-volos-resources` definition. It refers to a method on a helper function, as we'll explain next. 

```yaml
    passwordCheck:
      helper: volos
      function: passwordCheck
```

When the authorization server gets a request for an access token, and the grant type is "password", the helper function specified in the `passwordCheck `element is automatically called. In this case, the helper is `./api/helpers/volos.js` and the method is called `passwordCheck`. If you omit the `passwordCheck` element, you'll get this error:

`{"error_description":"Password check function not supplied","error":"internal_error"}`

The actual function is up to you to implement. Here's the code provided with this sample:

```javascript
    function passwordCheck(username, password, cb) {
      var passwordOk = (username === 'scott' && password === 'apigee');
      cb(null, passwordOk);
```

The input parameters must be provided in the token request. This `passwordCheck()` function will succeed if the token request supplies "scott" and "apigee" as the username and password. We'll see an example in the next section.

>Of course, a production implementation would validate the credentials against something like an LDAP repository or other user store. Typically, the client app provides a form where the user can enter her credentials, which are then passed in the access token request. 

### Requesting an access token

Okay, we assume you now have a client ID and a client secret, and the app user has provided her username and password. We're ready to go.

In the API's Swagger file, you'll see that these `tokenPaths` are specified in the OAuth provider configuration.  

````yaml
  tokenPaths:  # These will be added to your paths section for you
        token: /accesstoken
        invalidate: /invalidate
        refresh: /refresh
````

These are OAuth endpoints that you call to obtain and invalidate tokens, and to obtain new access tokens when a refresh token is presented. There are a few different ways to call these endpoints.

To request an access token, you can pass the `client_id` and `client_secret` as query parameters, along with the `username` and `password`:

````sh
  $ curl -X POST "http://localhost:10010/accesstoken" -d "grant_type=password&client_id=GtjU4A7zW1Ucu9Ws6BogOlzBrpiYFHJD&client_secret=2cA2VOlfWggVhILC&username=scott&password=apigee"

````

Or, a better practice is to encode the `client_id` and `client_secret` and pass them in a basic authorization header. Here's how:

First, you'll need a base64 encoding tool -- just locate one on the web. The basic authorization header is formed as follows: in the base64 encoding tool, enter the `client_id` and `client_secret` separated by a colon, like this:

`client_id:client_secret`

For example:

`hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ:we2YiMmC9kVZ1vjC`

Now, you can call the API like this (substituting your encoded credentials for the ones in the example, and including the username and password as parameters):

````sh
  $ curl -X POST -H 'Authorization: Basic aFRZRzZmY1FHcHNPOVp2eGpSa2UxdThtTWlRWjRHUo6d2UyWWlNbUM5a1ZaMXZqQw==' "https://localhost:10010/accesstoken" -d "grant_type=password&username=scott&password=apigee"
````

Or, because we're using curl, you can do the auth header with `-u` like this:

````sh
  $ curl -u hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ:hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ -X POST "https://localhost:10010/accesstoken" -d "grant_type=password&username=scott&password=apigee"
````

A successful response looks like this, and you can see that an `access_token `is included. 

````json
    {  
       "issued_at":"1417535785628",
       "scope":"",
       "application_name":"8b5842b8-b73f-47c1-b789-19541ece42be",
       "refresh_token_issued_at":"1417535785628",
       "status":"approved",
       "refresh_token_status":"approved",
       "api_product_list":"[Remote Proxy product]",
       "expires_in":299,
       "developer.email":"remote-proxy@apigee.com",
       "organization_id":"0",
       "token_type":"bearer",
       "attributes":"",
       "refresh_token":"WJvF1pBLMh44P00SXMY0zJOHkUyzbjGh",
       "client_id":"GtjU4A7zW1Ucu9Ws6BogOlzBrpiYFHJD",
       "access_token":"2ASlJLG4YxqVz1vQWDdQHcfiQg1O",
       "organization_name":"docs",
       "refresh_token_expires_in":"0",
       "refresh_count":"0"
    }
````


### Call the API

After all that work, you now have what you need to call the OAuth-protected API: an access token!

Start the example project on localhost:

```bash
  $ a127 project start
```

Call the API, substituting your access token for the bearer token in this example:

```bash
     curl -i -H 'Authorization: Bearer 2ASlJLG4YxqVz1vQWDdQHcfiQg1O' http://localhost:10010/weather?city=Kinston,NC
```
 
That's it, if you see weather data for Kinston, NC, you've succeeded in calling the protected API.

```json
  {  
     "coord":{  
        "lon":-77.58,
        "lat":35.27
     },
     "sys":{  
        "type":1,
        "id":1786,
        "message":0.2717,
        "country":"United States of America",
        "sunrise":1416397791,
        "sunset":1416434512
     },
     "weather":[  
        {  
           "id":800,
           "main":"Clear",
           "description":"sky is clear",
           "icon":"01d"
        }
     ],
     "base":"cmc stations",
     "main":{  
        "temp":41,
        "pressure":1028,
        "humidity":25,
        "temp_min":39.2,
        "temp_max":42.8
     },
     "wind":{  
        "speed":5.62,
        "deg":180
     },
     "clouds":{  
        "all":1
     },
     "dt":1416420900,
     "id":4474436,
     "name":"Kinston",
     "cod":200
  }
```

## <a name="redisprovider"></a>Use Redis as the authorization server

Let's run the sample using Redis as the authorization server. This option is nice if you do not want to use Apigee Edge. Redis also lets you run and test locally without the need for a remote connection. 

1. Open the Swagger editor with `a127 project edit`.
2. Comment the `volos-oauth-apigee` provider and uncomment the `volos-oauth-redis` provider: 

```yaml
  x-volos-resources:
    oauth2:
      #provider: "volos-oauth-apigee"
      provider: "volos-oauth-redis"
```

3. Run the following to download and install Redis. If you already have Redis installed, you can skip this step.

```bash
  $ sh redis.sh
```

4. Start Redis. You can use this script if you installed with `redis.sh`.

```bash
  $ sh start redis.sh
```

4. Initialize the Redis database with a developer and a developer app. Essentially, this is the registration step, and will result in creation of a client ID and client secret for the developer app. This Node.js script uses the [Volos.js](https://github.com/apigee-127/volos) management API to create the entities.

```sh
   $ node init-redis.js
```

Note that `init-redis.js` returns a developer object and an application object. Save the credentials for the application (the key and secret) -- you'll need them later.

```json
  THE DEVELOPER: 
     {  
       "id":"40264e1c-5283-48a0-8004-abe41099c068",
       "uuid":"40264e1c-5283-48a0-8004-abe41099c068",
       "email":"someperson@example.com",
       "userName":"someperson@example.com",
       "firstName":"Some",
       "lastName":"Person"
     }

  THE APP: 
    {  
       "id":"0d5a3c57-a3cc-4fdc-8d36-7c6a6b1b00ca",
       "uuid":"0d5a3c57-a3cc-4fdc-8d36-7c6a6b1b00ca",
       "name":"Test App",
       "developerId":"40264e1c-5283-48a0-8004-abe41099c068",
       "credentials":[  
          {  
             "key":"06pXyzIMlRYh2DOMC0SPhjdNvekFSUgWITtsitdSrNs=",
             "secret":"O8rajU0tdifbIx2EWb59hRSdL2t7rpVzb7Y0KPWRxSQ=",
             "status":"valid"
          }
       ],
       "scopes":[  
          "scope1",
          "scope2"
       ]
    }

  Client ID: UnTe0JZmaC9cbVRTI8QW9Kwvza8ZRrKS1RAmpYEOcrc=

  Client Secret: riumzPhjKwzva0A9L5WLin9JsaOWWoPHrNSaqNg1R0A=
```

4. Start your API on localhost:

```bash
  $ a127 project start
```

5. Send a request to retrieve an access token from the Redis authorization server. Substitute in the client ID and client secret you obtained previously:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=password&client_id=UnTe0JZmaC9cbVRTI8QW9Kwvza8ZRrKS1RAmpYEOcrc=&client_secret=riumzPhjKwzva0A9L5WLin9JsaOWWoPHrNSaqNg1R0A=&username=scott&password=apigee"
````

The result includes an access token: 

```json
  {  
     "issued_at":1417540116086,
     "access_token":"vghvpI46eOTVxsyYfZ58YGxiTkWEc5maj+vjyF8CA4I=",
     "expires_in":300,
     "refresh_token":"DddlxfBCVfMXyM+iB2xf+OetzqnE5QJJfZdQZlkqiZ8=",
     "token_type":"bearer"
  }
```

6. Now, call the API with the access token:

```sh
  curl -i -H 'Authorization: Bearer vghvpI46eOTVxsyYfZ58YGxiTkWEc5maj+vjyF8CA4I=' http://localhost:10010/weather?city=Kinston,NC
```

If the call succeeds, you get the weather report!

````json
  {  
     "coord":{  
        "lon":-77.58,
        "lat":35.27
     },
     "sys":{  
        "type":1,
        "id":1786,
        "message":0.2717,
        "country":"United States of America",
        "sunrise":1416397791,
        "sunset":1416434512
     },
     "weather":[  
        {  
           "id":800,
           "main":"Clear",
           "description":"sky is clear",
           "icon":"01d"
        }
     ],
     "base":"cmc stations",
     "main":{  
        "temp":41,
        "pressure":1028,
        "humidity":25,
        "temp_min":39.2,
        "temp_max":42.8
     },
     "wind":{  
        "speed":5.62,
        "deg":180
     },
     "clouds":{  
        "all":1
     },
     "dt":1416420900,
     "id":4474436,
     "name":"Kinston",
     "cod":200
  }
````


## <a name="redisprovider"></a>Extra credit: Using a refresh token

When the access token is generated, notice that the response also included a refresh_token. A refresh token lets you request a new access token (for instance, if the original one expires), without needing to repeat the entire flow (without asking the user to re-enter her credentials, for example). 

````json
    {  
       "issued_at":"1417535785628",
       "scope":"",
       "application_name":"8b5842b8-b73f-47c1-b789-19541ece42be",
       "refresh_token_issued_at":"1417535785628",
       "status":"approved",
       "refresh_token_status":"approved",
       "api_product_list":"[Remote Proxy product]",
       "expires_in":299,
       "developer.email":"remote-proxy@apigee.com",
       "organization_id":"0",
       "token_type":"bearer",
       "attributes":"",
       "refresh_token":"WJvF1pBLMh44P00SXMY0zJOHkUyzbjGh",
       "client_id":"GtjU4A7zW1Ucu9Ws6BogOlzBrpiYFHJD",
       "access_token":"2ASlJLG4YxqVz1vQWDdQHcfiQg1O",
       "organization_name":"docs",
       "refresh_token_expires_in":"0",
       "refresh_count":"0"
    }
````

You can request a new access token by calling the /refresh OAuth endpoint, like this:

````sh
  $ curl -X POST "http://localhost:10010/refresh" -d "grant_type=refresh_token&refresh_token=WJvF1pBLMh44P00SXMY0zJOHkUyzbjGh&client_id=GtjU4A7zW1Ucu9Ws6BogOlzBrpiYFHJD&client_secret=2cA2VOlfWggVhILC"

````

Remember to set the grant_type to `refresh_token` and pass the token in the `refresh_token` parameter. You also need to supply the `client_id` and `client_secret`, as you did when you requested an access token originally. 


