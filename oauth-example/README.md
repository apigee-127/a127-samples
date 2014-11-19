
* [What is this?](#whatisthis)
* [How it works?](#whatis)
* [How do I get it?](#howdo)
* [Use Apigee as the provider](#apigeeprovider)
* [Use Redis as the provider](#apigeeprovider)

## <a name="whatisthis"></a>What is this?

In this Apigee-127 example, we show you how to work with the OAuth 2.0 client credentials grant type. We'll add OAuth security to an API using the Swagger editor, generate a valid access token, and call the API. 

In the first part of the example, we'll use Apigee Edge as the OAuth provider (the "authorization server"). Later, we'll show how to use the Redis provider. 

> If you are not familiar with OAuth 2.0, there are many resources on the web. A good place to start is the [IETF specification](https://tools.ietf.org/html/draft-ietf-oauth-v2-31). It includes a good, general introduction to the framework, including grant types. 

## <a name="whatis">How it works

With the client credentials grant type, the client app requests an access token directly by providing its client ID and client secret keys to an authorization server (for example, Apigee Edge). These keys are generated when you register an app with the authorization server. The authorization server validates the credentials and returns an access token to the client. The client can then make secure calls to the resource server.

Here's the flow, where Apigee Edge is the authorization server:

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

Next, we'll run the example using Apigee as the OAuth provider, and then using Redis.

## <a name="apigeeprovider"></a>Use Apigee as the provider

In this part, we'll secure the API with OAuth and use Apigee Edge as the authorization server. This means that the API will call a service deployed on Apigee Edge to generate and verify access tokens. 

> If you select Apigee when you create a new Apigee-127 account, an API proxy called `apigee-remote-proxy` is automatically deployed to your Apigee Edge organization. This proxy implements the OAuth endpoints needed to get access tokens, authorization codes, and so on. In addition, a developer, an API product, and a developer app are provisioned for you. 

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

Be sure this account is selected (is the currently active account):

`$ a127 account select foo`

### Examine the OAuth provider configuration in the Swagger editor

By default, the example is configured to use Apigee Edge as the OAuth 2.0 provider (authorization server).

In a terminal window, cd to the root of the example project `./oauth-example`, and start the Swagger editor:

`a127 project edit`

Notice in the `x-volos-resources section` there's a resource called `oauth2`, and that `volos-oauth-apigee provider` is uncommented. The only other option is a Redis implementation. We'll look at that one later in this example.


```` yaml
x-volos-resources:
  ## Add the spike arrest module
  oauth2:
    provider: "volos-oauth-apigee"
    #provider: "volos-oauth-redis"
    options:
      tokenLifetime: 300000
      key: *apigeeProxyKey
      uri: *apigeeProxyUri
      validGrantTypes:
        - client_credentials
        - authorization_code
        - implicit_grant
        - password
      tokenPaths:  # These will be added to your paths section for you
        authorize: /authorize
        token: /accesstoken
        invalidate: /invalidate
        refresh: /refresh
````

Here's a quick description of the oauth2 configuration:

* provider -- The authorization server implementation -- either Apigee or Redis. 
* tokenLifetime -- The life span of an access token in milliseconds.
* key -- The client ID that is used to authenticate access to the `apigee-remote-proxy` services. It was generated when you created your account.  
* uri -- The URI for the `apigee-remote-proxy` deployed on Apigee Edge. Also generated when you created your account.
* validGrantTypes -- The OAuth 2.0 grant types the authorization server can handle. In this example, we're focusing on the client credentials grant type.
* tokenPaths -- The paths that resolve to token endpoints on the authorization server. The endpoints generate access tokens, authorization codes, handle refresh tokens, and so on. 

### Add OAuth security to the API

The example is set up with OAuth security on the `/weather` path of the API. This simply means that when you call the API with `/weather` in the path, OAuth security will be enforced on that path. You can protect any path in your API simply by adding the same `x-volos-authorizations` reference to it. Here's what it looks like in the example's Swagger file: 

````yaml
paths:
  /weather:
    x-swagger-router-controller: weather
    x-volos-authorizations:
        oauth2: {}
````

That's it, an OAuth provider is configured and OAuth 2.0 authorization has been added to the `/weather` path. 

### Call the API

In a terminal window, cd to the root of the example project `./oauth-example`. Start the example project:

`a127 project start`

Let's see what happens when you call the API:

`curl -i "http://localhost:10010/weather?city=Kinston,NC"`

As expected, you get an error because you did not call the API with a valid access token:

`{"error_description":"Missing Authorization header","error":"missing_authorization"}`

Next, we'll get that access token and call the API properly.

### Getting client credentials for an app

Remember that whenever an app uses OAuth, that app must be registered with an authorization server. It is through registration that the app receives its client credentials: a client ID and a client secret. These credentials allow the authorization server to uniquely identify the app. 

To run the example, you'll need to obtain a valid set of credentials for an app that is registered with Apigee Edge (it doesn't really matter which app, as long as it exists). For a quick set of steps, see [Obtaining the client credentials](#getcreds) below. Just save the ID and secret -- you'll need them when you request an access token. 

### <a name="getcreds"></a>Obtaining the client credentials

The simplest way to get a usable set of client credentials is from the default developer app that was provisioned when you created your Apigee-127 account. 

1. Log in to your Apigee Edge account. 
2. From the main menu, select **Publish > Developer** apps.
3. In the list of apps, locate the one called **Remote Proxy**. 
4. In the Remote Proxy page, locate the Remote Proxy product and click **Show** next to the Consumer Key and Consumer Secret fields. 
5. Save those values, you'll need them to request an access token.

>Note: The Apigee UI refers to the client ID and client secret as Consumer Key and Consumer Secret. They are the same thing.

### Requesting an access token

Okay, we assume you now have a client ID and a client secret. 

In the API's Swagger file, you'll see that these `tokenPaths` are specified in the OAuth provider configuration.  

````yaml
tokenPaths:  # These will be added to your paths section for you
        authorize: /authorize
        token: /accesstoken
        invalidate: /invalidate
        refresh: /refresh
````

These are OAuth endpoints -- URIs that you can call to obtain OAuth access tokens, refresh tokens, and authorization codes. We're going to ask the authorization server for an access token, like this:

````sh
$ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ&client_secret=we2YiMmC9kVZ1vjC"
````

A better practice is to encode the `client_id` and `client_secret` and pass them in a basic authorization header. Here's how:

You'll need a base64 encoding tool -- just locate one on the web. The basic authorization header is formed as follows: in the base64 encoding tool, enter the `client_id` and `client_secret` separated by a colon, like this:

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

As succesful response looks like this, and you can see that an `access_token `is included. 

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

Start your API on localhost:

```bash
$ a127 project start
```

Call the API, substituting your access token for the bearer token in this example:

```bash
curl -i -H 'Authorization Bearer: 3JTnOwzrfTtnbMGDdys2ZymGAA7t' http://localhost:10010/weather?city=Kinston,NC
```
 
That's it, if you see weather data for Kinston, NC, you've succeeded in calling the protected API.

## ## <a name="redisprovider"></a>Use Redis as the provider

1. Open the Swagger editor with `a127 project edit`.
2. Comment the `volos-oauth-apigee` provider and uncomment the `volos-oauth-redis` provider: 

```yaml
  x-volos-resources:
    oauth2:
      provider: "volos-oauth-apigee"
      #provider: "volos-oauth-redis"
```

3. Under the options part of the oauth2 resource, uncomment encryptionKey, host, and port. 

```yaml

  x-volos-resources:
    oauth2:
      #provider: "volos-oauth-apigee"
      provider: "volos-oauth-redis"
      options:
        tokenLifetime: 300000
        key: *apigeeProxyKey
        uri: *apigeeProxyUri
        encryptionKey: 'abc123'
        host: '127.0.0.1'
        port: 6379
```

3. Run the following to download and install Redis:

```bash
  $ sh redis.sh
```

4. Start Redis:
```bash
  $ sh start redis.sh
```

4. Initialize the Redis database with a developer and a developer app. This is the registration step, and will result in creation of a client ID and client secret for the developer app. This runs a Node.js script that uses the Volos.js management API to create the entities.

```sh
   $ node init-redis.js
```

Sample result. Note that the result includes a developer object and an application object. Save the credentials for the application (the key and secret) -- you'll need them later.

```
{"id":"872cb76a-cf73-4677-9122-ed78292cfbc2","uuid":"872cb76a-cf73-4677-9122-ed78292cfbc2","email":"sganyo@apigee.com","userName":"sganyo","firstName":"Scott","lastName":"Ganyo"}
APP: {"id":"e7584ff0-8ba9-4f1c-93d7-5d37cde81af2","uuid":"e7584ff0-8ba9-4f1c-93d7-5d37cde81af2","name":"MyApplication","developerId":"872cb76a-cf73-4677-9122-ed78292cfbc2","credentials":[{"key":"lEp5wgEMzl3cFBGrj6MGooKOdYB7g6shUnI0XlII8PA=","secret":"oZxYLa2MBMFGALPibx5gLLZS3OXGWan3bWbIWpB2VX0=","status":"valid"}],"scopes":["scope1","scope2"]}
```

4. Start your API on localhost:
```bash
$ a127 project start
```

5. Send a request to retrieve an access token from the Redis authorization server. Substitute in the client ID and client secret you obtained previously. 

````sh
$ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=hTYG6fcQGpsO9ZvxjRke1u8mMiQZ4GAJ&client_secret=we2YiMmC9kVZ1vjC"
````

Sample result. Note that it includes an access token. 

```
{"issued_at":1416421296897,"access_token":"bbTnngjrjFoEP8wy7UXzZgqQwtiAaQOOc3VXf0uipqg=","expires_in":300,"token_type":"bearer"}
```

6. Now, call the API with the access token:


```bash
curl -i -H 'Authorization Bearer: bbTnngjrjFoEP8wy7UXzZgqQwtiAaQOOc3VXf0uipqg=' http://localhost:10010/weather?city=Kinston,NC
```

Sample result. The weather!

````
{"coord":{"lon":-77.58,"lat":35.27},"sys":{"type":1,"id":1786,"message":0.2717,"country":"United States of America","sunrise":1416397791,"sunset":1416434512},"weather":[{"id":800,"main":"Clear","description":"sky is clear","icon":"01d"}],"base":"cmc stations","main":{"temp":41,"pressure":1028,"humidity":25,"temp_min":39.2,"temp_max":42.8},"wind":{"speed":5.62,"deg":180},"clouds":{"all":1},"dt":1416420900,"id":4474436,"name":"Kinston","cod":200}
````







