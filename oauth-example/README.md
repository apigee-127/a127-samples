# OAuth example

* [What is this?](#whatisthis)
* [How it works?](#whatis)
* [How do I get it?](#howdo)
* [Use Apigee as the provider](#apigeeprovider)
* [Use Redis as the provider](#apigeeprovider)

## <a name="whatisthis"></a>What is this?

In this Apigee-127 example, we show you how to:

* Obtain an access token with the OAuth 2.0 client credentials grant type. In the first part of the example, we'll use Apigee Edge as the "authorization server" and then we'll show you how to use Redis running locally.

* Add and configure OAuth security to an API using the Swagger editor. 

> If you are not familiar with OAuth 2.0 and terms like grant type and authorization server, there are many resources available on the web. We recommend you start with the [IETF specification](https://tools.ietf.org/html/draft-ietf-oauth-v2-31). It includes a good, general introduction to the OAuth 2.0 framework and its use cases.

## <a name="whatis">How it works

The OAuth 2.0 client credentials grant type is fairly straightforward. A client app requests an access token directly by providing its client ID and client secret keys to an authorization server (for example, Apigee Edge). 

The client ID and secret keys are generated when you register an app with an authorization server. App registration is always required whenever you use OAuth.

The client credentials flow looks like this, where Apigee Edge is the authorization server:

![alt text](../images/oauth-client-cred-flow-3.png)

## <a name="howdo"></a>How do I get it?

#### 1) Clone this repository from Git
```bash 
  $ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
  $ cd a127-samples/oauth-example
  $ npm install
```

Now that you have things installed, let's run through the example. First, we'll use Apigee Edge as the OAuth provider.

## <a name="apigeeprovider"></a>Use Apigee as the authorization server

In this part, we'll secure the example API with OAuth and use Apigee Edge as the authorization server. This means that the API will call a service deployed on Apigee Edge to generate and verify access tokens. 

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

> When you select Apigee as the account provider, an API proxy called `apigee-remote-proxy` is automatically deployed to your Apigee Edge organization. This proxy implements the OAuth endpoints needed to get access tokens, authorization codes, and so on. In addition, you'll get a configured developer app that includes client ID and secret keys that you can use to make OAuth calls. 

Be sure this Apigee account is selected (is the currently active account):

`$ a127 account select foo`

### Examine the OAuth provider configuration in the Swagger editor

By default, the example is configured to use Apigee Edge as the OAuth 2.0 provider (authorization server).

In a terminal window, cd to the root of the example project `./oauth-example`, and start the Swagger editor:

`a127 project edit`

Notice in the `x-volos-resources section` there's a resource called `oauth2`, and that `volos-oauth-apigee provider` is uncommented. The only other option is a Redis implementation. We'll look at that one later in this example.


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
        validGrantTypes:
          - client_credentials
        tokenPaths:  # These will be added to your paths section for you
          token: /accesstoken
          invalidate: /invalidate
````

Here's a quick description of the oauth2 configuration:

* provider -- The authorization server implementation -- either Apigee or Redis. 
* key -- The client ID that is used to authenticate access to the `apigee-remote-proxy` services. It was generated when you created your account.  
* uri -- The URI for the `apigee-remote-proxy` deployed on Apigee Edge. Also generated when you created your account.
* encryptionKey -- A key used by the Redis provider to generate encrypted tokens.
* host -- The host where the Redis server is running.
* port -- The port where the Redis server is listening.
* tokenLifetime -- The life span of an access token in milliseconds.
* validGrantTypes -- The OAuth 2.0 grant types the authorization server can handle. In this example, we're focusing on the client credentials grant type.
* tokenPaths -- The paths that resolve to token endpoints on the authorization server. The endpoints generate access tokens and allow you to invalidate tokens.

### Add OAuth security to the API

The example is set up with OAuth security on the `/weather` path of the API. You can protect any path in your API simply by adding the same `x-volos-authorizations` reference to it. Here's what it looks like in the example's Swagger file: 

````yaml
  paths:
    /weather:
      x-swagger-router-controller: weather
     x-volos-authorizations:
         oauth2: {}
````

That's it, just in the Swagger file, we've configured an OAuth provider and added OAuth 2.0 security to the `/weather` path. The `/weather` path will only execute if the request has a valid access token, as we'll see next.

### Call the API

In a terminal window, cd to the root of the example project `./oauth-example`. Start the example project:

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

### Requesting an access token

Okay, we assume you now have a client ID and a client secret ready to go.

In the API's Swagger file, you'll see that these `tokenPaths` are specified in the OAuth provider configuration.  

````yaml
  tokenPaths:  # These will be added to your paths section for you
        token: /accesstoken
        invalidate: /invalidate
````

These are OAuth endpoints that you call to obtain and invalidate tokens. There are a few different ways to call these endpoints.

To request an access tokeh, you can pass the `client_id` and `client_secret` as query parameters:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ&client_secret=we2YiMmC9kVZ1vjC"
````

Or, a better practice is to encode the `client_id` and `client_secret` and pass them in a basic authorization header. Here's how:

First, you'll need a base64 encoding tool -- just locate one on the web. The basic authorization header is formed as follows: in the base64 encoding tool, enter the `client_id` and `client_secret` separated by a colon, like this:

`client_id:client_secret`

For example:

`hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ:we2YiMmC9kVZ1vjC`

Now, you can call the API like this (substituting your encoded credentials for the ones in the example):

````sh
  $ curl -X POST -H 'Authorization: Basic aFRZRzZmY1FHcHNPOVp2eGpSa2UxdThtTWlRWjRHUo6d2UyWWlNbUM5a1ZaMXZqQw==' "https://localhost:10010/accesstoken" -d "grant_type=client_credentials"
````

Or, because we're using curl, you can do the auth header with `-u` like this:

````sh
  $ curl -u hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ:hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials"
````

As successful response looks like this, and you can see that an `access_token `is included. 

````json
    {
        "access_token": "7zSVVqNCsGYQKWDKyXGOTUBA",
        "api_product_list": "[Test App product]",
        "api_profile_name": null,
        "application_name": "921c6d-78c0-4b81-9884-c1f7d7b8f",
        "client_id": "o2lxnymzY9iDkjXb9PsNJCZNJXVP",
        "developer_email": "someperson@example.com",
        "expires_in": 1799,
        "issued_at": 1411398701495,
        "organization_id": "0",
        "organization_name": "wwitman",
        "refresh_count": 0,
        "refresh_token": null,
        "refresh_token_expires_in": 0,
        "refresh_token_status": null,
        "scope": "",
        "state": null,
        "status": "approved",
        "token_type": "bearer"
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
  curl -i -H 'Authorization Bearer: 3JTnOwzrfTtnbMGDdys2ZymGAA7t' http://localhost:10010/weather?city=Kinston,NC
```
 
That's it, if you see weather data for Kinston, NC, you've succeeded in calling the protected API.

```json
  {"coord":{"lon":-77.58,"lat":35.27},"sys":{"type":1,"id":1786,"message":0.1021,"country":"United States of America","sunrise":1416397791,"sunset":1416434512},"weather":[{"id":800,"main":"Clear","description":"sky is clear","icon":"01d"}],"base":"cmc stations","main":{"temp":43,"pressure":1026,"humidity":26,"temp_min":41,"temp_max":44.6},"wind":{"speed":7.78,"deg":190},"clouds":{"all":1},"dt":1416429300,"id":4474436,"name":"Kinston","cod":200}
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

```
  THE DEVELOPER: {"id":"9d550e32-bc14-4e29-b4d6-609030b27f8d","uuid":"9d550e32-bc14-4e29-b4d6-609030b27f8d","email":"someperson@example.com","userName":"someperson@example.com","firstName":"Some","lastName":"Person"}

  THE APP: {"id":"21612a13-bdda-43ac-8e7a-d5ee49d365bf","uuid":"21612a13-bdda-43ac-8e7a-d5ee49d365bf","name":"Test App","developerId":"9d550e32-bc14-4e29-b4d6-609030b27f8d","credentials":[{"key":"UnTe0JZmaC9cbVRTI8QW9Kwvza8ZRrKS1RAmpYEOcrc=","secret":"riumzPhjKwzva0A9L5WLin9JsaOWWoPHrNSaqNg1R0A=","status":"valid"}],"scopes":["scope1","scope2"]}

  Client ID: UnTe0JZmaC9cbVRTI8QW9Kwvza8ZRrKS1RAmpYEOcrc=

  Client Secret: riumzPhjKwzva0A9L5WLin9JsaOWWoPHrNSaqNg1R0A=
```

4. Start your API on localhost:

```bash
  $ a127 project start
```

5. Send a request to retrieve an access token from the Redis authorization server. Substitute in the client ID and client secret you obtained previously:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ&client_secret=we2YiMmC9kVZ1vjC"
````

The result includes an access token: 

```
  {"issued_at":1416421296897,"access_token":"bbTnngjrjFoEP8wy7UXzZgqQwtiAaQOOc3VXf0uipqg=","expires_in":300,"token_type":"bearer"}
```

6. Now, call the API with the access token:

```bash
  curl -i -H 'Authorization Bearer: bbTnngjrjFoEP8wy7UXzZgqQwtiAaQOOc3VXf0uipqg=' http://localhost:10010/weather?city=Kinston,NC
```

If the call succeeds, you get the weather report!

````
  {"coord":{"lon":-77.58,"lat":35.27},"sys":{"type":1,"id":1786,"message":0.2717,"country":"United States of America","sunrise":1416397791,"sunset":1416434512},"weather":[{"id":800,"main":"Clear","description":"sky is clear","icon":"01d"}],"base":"cmc stations","main":{"temp":41,"pressure":1028,"humidity":25,"temp_min":39.2,"temp_max":42.8},"wind":{"speed":5.62,"deg":180},"clouds":{"all":1},"dt":1416420900,"id":4474436,"name":"Kinston","cod":200}
````







