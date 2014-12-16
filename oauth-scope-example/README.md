# OAuth 2.0 scope example with Apigee-127

* [What is this?](#whatisthis)
* [How it works?](#whatis)
* [How do I get it?](#howdo)
* [Use Apigee as the provider](#apigeeprovider)
* [Use Redis as the provider](#apigeeprovider)

## <a name="whatisthis"></a>What is this?

This example demonstrates how to use OAuth 2.0 scopes to an Apigee-127 API. Scope is an OAuth 2.0 feature that lets you limit the amount of access an app has to private data owned by the app's end user. 

Scope is a somewhat advanced topic, and we assume you have looked at one of the other OAuth samples, such as oauth-cc-example or oauth-password-sample before continuing. 

> If you are not familiar with OAuth 2.0, there are many resources available on the web. We recommend you start with the [IETF specification](https://tools.ietf.org/html/draft-ietf-oauth-v2-31). It includes a good, general introduction to the OAuth 2.0 framework including scopes.

## <a name="whatis">How it works


OAuth 2.0 scopes limit the amount of access afforded to an access token. When a token is minted, it can be assigned zero or more scopes. A token might have a cope of "READ WRITE". So, that access token will only be permitted to access APIs that have READ WRITE scope. 

Scope is enforced by the APIs themselves. When you attach an OAuth provider to a path in the swagger.yaml file, you can specify a scope for that path. For example:

````yaml
    paths:
      /weather_rwd:
        x-swagger-router-controller: weather
        x-volos-authorizations:
            oauth2:
              scope: 'READ WRITE DELETE'
````

Here, the `/weather_rwd` path will only succeed if the access token supports READ WRITE DELETE scope. 

In this example, we'll mint access tokens with different combinations of scopes, and try calling scope-aware APIs with them. 

## <a name="howdo"></a>How do I get it?

#### 1) Clone this repository from Git
```bash 
  $ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
  $ cd a127-samples/oauth-scope-example
  $ npm install
```

Now that you have things installed, let's run through the example. First, we'll use Apigee Edge as the OAuth provider.

## Create an Apigee-127 account

If you haven't done so, create an Apigee-127 account, and select `apigee` as the Provider:

```sh
  $ a127 account create foo
  [?] Provider? 
    amazon 
  ❯ apigee 
    local 
```

Follow the prompts, entering your Apigee account information. 

> When you select Apigee as the account provider, an API proxy called `apigee-remote-proxy` is automatically deployed to your Apigee Edge organization. This proxy implements the OAuth endpoints needed to get access tokens, authorization codes, and so on. 

Be sure this Apigee account is selected (is the currently active account):

`$ a127 account select foo`

## Provision Apigee Edge entities

To use OAuth with the Apigee provider, you need to provision these entities on Apigee Edge: a developer, three products, and a developer app. 

1. CD to the root directory of this example: `./oauth-scope-example`. 
2. Edit `provisioning/setenv.sh` with your Apigee account information. 
3. Execute the file: `$ sh provisioning/provision.sh`. This script uses Apigee Edge APIs to create the required entities in your Apigee organization.

Upon completion, you'll receive back a Consumer ID and Consumer Secret key:

```
    Consumer ID for jdoe-app is: ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u
    Consumer Secret for jdoe-app is: A3e0CYEbVRHYD1KU
```

<<SHOW PICTURE OF APP in UI>>

## Master list of scopes

Now, it's important to see that we created a developer app that has three products assigned to it. Each product, has scopes assigned to it. Like this:

Free Product: READ
Cheap Product: READ WRITE
Expensive Product: READ WRITE DELETE

<<SHOW PICTURE OF THE PREMIUM PRODUCT SCOPES>>

Apigee Edge creates a master list of scopes that are recognized by each developer app. That is, the master list consists of a union of all of the scopes for all of the products in the developer. In this case, that master list for JDoe's app is "READ WRITE DELETE". 


## Examine the OAuth provider configuration in the Swagger editor

By default, the example is configured to use Apigee Edge as the OAuth 2.0 provider (authorization server).

In a terminal window, cd to the root of the example project `./oauth-scope-example`, and start the Swagger editor:

`a127 project edit`

Notice in the `x-volos-resources section` there's a resource called `oauth2`, and that `volos-oauth-apigee provider` is the OAuth provider. 


```` yaml
  x-volos-resources:
    oauth2:
      provider: "volos-oauth-apigee"
      options:
        key: *apigeeProxyKey
        uri: *apigeeProxyUri
        tokenLifetime: 300000
        validGrantTypes:
          - client_credentials
          - implicit_grant
          - authorization_code
          - passwrod
        tokenPaths:  # These will be added to your paths section for you
          token: /accesstoken
          invalidate: /invalidate
          refresh: /refresh
          authorize: /authorize
````

Here's a quick description of the oauth2 configuration:

* provider -- The authorization server implementation. In this example we're using `apigee`.
* key -- The client ID that is used to authenticate access to the `apigee-remote-proxy` services. It was generated when you created your account.  
* uri -- The URI for the `apigee-remote-proxy` deployed on Apigee Edge. Also generated when you created your account.
* tokenLifetime -- The life span of an access token in milliseconds.
* validGrantTypes -- The OAuth 2.0 grant types the authorization server can handle. In this example, we're focusing on the client credentials grant type.
* tokenPaths -- The paths that resolve to token endpoints on the authorization server. The endpoints generate access tokens and allow you to invalidate tokens.

### Add OAuth security to the API

The example is set up with a set of paths, each with a different OAuth scope specified. They are:

`/weather` (no scopes)
`/weather_r` (READ scope)
`/weather_rw` (READ and WRITE scope)
`/weather_rwd` (READ, WRITE, and DELETE scope)

For example, the `/weather` (no scopes) path is configured like this. The oauth2 provider is applied, but no scopes are specified:

```yaml
    paths:
      /weather:
        x-swagger-router-controller: weather
        x-volos-authorizations:
            oauth2: {}
```

On the other hand, the `/weather_rwd` path is assigned READ, WRITE, DELETE scope like this:

````yaml
    paths:
      /weather_rwd:
        x-swagger-router-controller: weather
        x-volos-authorizations:
            oauth2:
              scope: 'READ WRITE DELETE'
````

That's it. You can see how easy it is to apply scopes to endpoints protected with OAuth. 

>It's important to see that scopes are enforced at the API level. It's up to the API developer to decide where to apply scopes and what to name them. 

Now, let's see how we can create access tokens that are scope-aware!

### Requesting an access token with no scope

In the API's Swagger file, you'll see that these `tokenPaths` are specified in the OAuth provider configuration.  

````yaml
  tokenPaths:  # These will be added to your paths section for you
        token: /accesstoken
        invalidate: /invalidate
        refresh: /refresh
        authorize: /authorize
````

These are OAuth endpoints that you call to obtain and invalidate tokens. There are a few different ways to call these endpoints. 

To request an access token, you can pass the `client_id` and `client_secret` as query parameters:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u&client_secret=A3e0CYEbVRHYD1KU"
````

Here's the result. As you can see, an access token request returns a JSON object with a bunch of metadata. The important elements to zoom in on for now are the access_token and scope. 

```json
    {  
       "issued_at":"1417644283505",
       "application_name":"c9c03c1d-013b-4497-8180-06d612501a35",
       "scope":"DELETE READ WRITE",
       "status":"approved",
       "api_product_list":"[CheapProduct, FreeProduct, ExpensiveProduct]",
       "expires_in":29999,
       "developer.email":"jdoe@example.com",
       "organization_id":"0",
       "token_type":"bearer",
       "attributes":"",
       "client_id":"ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u",
       "access_token":"f4MHClKyIGJow8G2j6i0ituz9Z5G",
       "organization_name":"docs",
       "refresh_token_expires_in":"0",
       "refresh_count":"0"
    }
```

>IMPORTANT: Notice that the scope is DELETE READ WRITE. By default, if you request an access token without supplying the "scope" query parameter, Apigee Edge returns all of the scopes recognized by the developer app (the union of scopes from all the app's products). 

So, now we have an access token with READ, WRITE, and DELETE scopes. This means that you can use this token to call any API that has a scope of READ, WRITE, or DELETE. Notice that if the API has any one of these scopes, the API call will succeed with this access token. 

Let's see call the API and find out if this is true:


### Call the API

In a terminal window, cd to the root of the example project `./oauth-scope-example`. Start the example project:

`a127 project start`

Let's see what happens when you call the API without with the access token that has all three scopes. 

1. Call the /weather path:

`curl -i -H "Authorization: Bearer f4MHClKyIGJow8G2j6i0ituz9Z5G" "http://localhost:10010/weather?city=Kinston,NC"`

The API succeeds, because the /weather path does not have any scopes specified. So, it effectively ignores scope. 

2. Call the `/weather_r` path:

`curl -i -H "Authorization: Bearer f4MHClKyIGJow8G2j6i0ituz9Z5G" "http://localhost:10010/weather_r?city=Kinston,NC"`

It also succeeds, because the path has READ scope, and the access token supports READ scope. The API will succeed for any of the paths that have READ, WRITE, or DELETE scope. 

3. call the `/weather_bogus` path:

`curl -i -H "Authorization: Bearer f4MHClKyIGJow8G2j6i0ituz9Z5G" "http://localhost:10010/weather_bogus?city=Kinston,NC"`

This time an invalid scope error is returned, because the path is assigned a scope of BOGUS, and the access token only supports READ, WRITE, and DELETE scope. 

`{"error_description":"invalid_scope","error":"invalid_scope"}`

### Requesting an access token with READ scope

You can mint an access token that only has READ scope by specifying the scope parameter, like this:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u&client_secret=A3e0CYEbVRHYD1KU&scope=READ"
````

Here's the access token. Notice it has a new set up keys, and the scope is READ:

```json
    {  
       "issued_at":"1417646196263",
       "application_name":"c9c03c1d-013b-4497-8180-06d612501a35",
       "scope":"READ",
       "status":"approved",
       "api_product_list":"[CheapProduct, FreeProduct, ExpensiveProduct]",
       "expires_in":29999,
       "developer.email":"jdoe@example.com",
       "organization_id":"0",
       "token_type":"bearer",
       "attributes":"",
       "client_id":"ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u",
       "access_token":"jgRksWi3MQsVRLiAWvc1IT1hh9vx",
       "organization_name":"docs",
       "refresh_token_expires_in":"0",
       "refresh_count":"0"
    }
```


### Call the API

In a terminal window, cd to the root of the example project `./oauth-scope-example`. Start the example project:

`a127 project start`

Let's see what happens when you call the API without with the access token that has only READ scope: 

1. Call the /weather path:

`curl -i -H "Authorization: Bearer jgRksWi3MQsVRLiAWvc1IT1hh9vx" "http://localhost:10010/weather?city=Kinston,NC"`

The API succeeds, because the `/weather` path does not have any scopes specified. So, it effectively ignores scope. 

2. Call the `/weather_r` path:

`curl -i -H "Authorization: Bearer jgRksWi3MQsVRLiAWvc1IT1hh9vx" "http://localhost:10010/weather_r?city=Kinston,NC"`

It also succeeds, because the path has READ scope, and the access token supports READ scope. 

3. call the `/weather_rw` path:

`curl -i -H "Authorization: Bearer jgRksWi3MQsVRLiAWvc1IT1hh9vx" "http://localhost:10010/weather_rw?city=Kinston,NC"`

This call fails, because the token only supports READ access, and this API has READ and WRITE access. 

`{"error_description":"invalid_scope","error":"invalid_scope"}`


### Requesting an access token with READ and WRITE

For a final example, let's mint a token with READ and WRITE scope:

````sh
  $ curl -X POST "https://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u&client_secret=A3e0CYEbVRHYD1KU&scope=READ WRITE"
````

Here's the access token. Notice it has a new set up keys, and the scope is READ:

```json
    {  
       "issued_at":"1417646196263",
       "application_name":"c9c03c1d-013b-4497-8180-06d612501a35",
       "scope":"READ WRITE",
       "status":"approved",
       "api_product_list":"[CheapProduct, FreeProduct, ExpensiveProduct]",
       "expires_in":29999,
       "developer.email":"jdoe@example.com",
       "organization_id":"0",
       "token_type":"bearer",
       "attributes":"",
       "client_id":"ubrUzWveJQyG4Ak6rRrxe2eajmg7nR8u",
       "access_token":"DUZkGl3mpcXlKZOsERHZx91N3DKU",
       "organization_name":"docs",
       "refresh_token_expires_in":"0",
       "refresh_count":"0"
    }
```


### Call the API

Let's see what happens when you call the API with the access token that has only READ scope: 

1. Call the /weather path:

`curl -i -H "Authorization: Bearer DUZkGl3mpcXlKZOsERHZx91N3DKU" "http://localhost:10010/weather_r?city=Kinston,NC"`

The API succeeds, because the `/weather_r` has READ scope, and the access token supports both READ and WRITE. 

2. Call the `/weather_rw` path:

`curl -i -H "Authorization: Bearer DUZkGl3mpcXlKZOsERHZx91N3DKU" "http://localhost:10010/weather_r?city=Kinston,NC"`

Again, it also succeeds, because the path has READ and WRITE scope, and the access token supports both. 

3. call the `/weather_rwd` path:

`curl -i -H "Authorization: Bearer DUZkGl3mpcXlKZOsERHZx91N3DKU" "http://localhost:10010/weather_rwd?city=Kinston,NC"`

This call fails, because the token only supports READ and WRITE access, and this API has READ, WRITE, and DELETE access. 

`{"error_description":"invalid_scope","error":"invalid_scope"}`






