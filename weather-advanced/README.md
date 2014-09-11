# What is this?

This is an example of an Apigee-127 project that uses Caching, Quota, OAuth and Analytics using Swagger 2.0 extensions.

# How do I use it?
1) Clone this repository from Git: 

`$ git clone https://github.com/apigee-127/a127-samples`

It has two samples:
- Weather Basic
- Weather Advanced (this example)

2) Create an Account configuration using `a127 account create`: [a127 Account Reference](https://github.com/apigee-127/a127-documentation/wiki/Apigee-127-command-line-reference#a127-account)
You will need an account on Apigee Developer (free) for the advanced example.

3) Copy config/secrets.sample.js to config/secrets.js.  Edit config/secrets.js and specify your Edge account information.  This is required by the Volos management module.

```javascript
exports.apigee = {
  organization: 'jdoe',
  user: 'jdoe@apigee.com',
  password: 'mypassword'
};
```

4) Once you have it cloned from git and an account created successfully with `a127 account create`:

```bash
$ cd a127-samples/weather-advanced
$ npm install
$ a127 project start
```

5) Once you have the project started you can issue curl commands or use Postman to hit the API:

### Direct API call to OpenWeatherMap API:
```bash
$ curl http://localhost:10010/weather?city=Kinston,NC
```
When you hit this API you will see one line in the console from `a127 project start` every time is run:

    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial

### Cached (10s TTL) API call to OpenWeatherMap API:
```bash
$ curl http://localhost:10010/weather_cached?city=Kinston,NC
```
When you hit this API you will see one output like the folloiwng in the console from `a127 project start`:

    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial
    Cache Key: Kinston,NC
    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial
    Cache Key: Kinston,NC
    Cache Key: Kinston,NC
    Cache Key: Kinston,NC
    Cache Key: Kinston,NC
    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial

You will always see `Cache Key: Kinston, NC` and you will only see `Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial` after the cache entry expires.

### API call to OpenWeatherMap API with a Quota (2 per minute):

Execute three calls to the endpoint within one minute.  The first two will succeed, the third will fail:

```bash
$ curl http://localhost:10010/weather_quota?city=Kinston,NC
$ curl http://localhost:10010/weather_quota?city=Kinston,NC
$ curl http://localhost:10010/weather_quota?city=Kinston,NC
```

Client Output: 

    $ curl http://localhost:10010/weather_quota\?city\=Kinston,NC
    Error: exceeded quota<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:92:15<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota.js:137:5<br> &nbsp; &nbsp;at MemoryQuotaSpi.apply (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/lib/memoryquota.js:88:3)<br> &nbsp; &nbsp;at Quota.apply (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota.js:136:14)<br> &nbsp; &nbsp;at applyQuota (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:82:14)<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:49:5<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:136:9<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-analytics-common/lib/analytics-connect.js:39:3<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:136:9<br> &nbsp; &nbsp;at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:139:41

Server Output: 

    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial
    Quota Key: someKey
    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial
    Quota Key: someKey
    Executing request: http://api.openweathermap.org/data/2.5/weather?q=Kinston,NC&units=imperial
    Quota Key: someKey
    Error: exceeded quota
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:92:15
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota.js:137:5
        at MemoryQuotaSpi.apply (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/lib/memoryquota.js:88:3)
        at Quota.apply (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota.js:136:14)
        at applyQuota (/Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:82:14)
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-quota-memory/node_modules/volos-quota-common/lib/quota-connect.js:49:5
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:136:9
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/volos-analytics-common/lib/analytics-connect.js:39:3
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:136:9
        at /Users/ApigeeCorporation/projects/a127-samples/weather-advanced/node_modules/a127-magic/node_modules/volos-swagger/lib/connect-middleware.js:139:41

### API call to OpenWeatherMap API Using OAuth:

When the project starts it will log messages to the console like the following:

```
---------
try this Cached call (10s TTL):
curl http://localhost:10010/weather_cached?city=Kinston,NC
---------
try this call which has a 2-per minute Quota:
curl http://localhost:10010/weather_quota?city=Kinston,NC
---------
Client ID: k6l4TO4DsnQr72LdAIZAxWVZKhXhfM5I
Client Secret: tske5wxrUKZsbAbp
Access Token: MNwqguWBakpicmV6bgsXhGL5RAqd
listening on 10010

example curl commands:

Get a Client Credential Token:
curl -X POST "http://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=k6l4TO4DsnQr72LdAIZAxWVZKhXhfM5I&client_secret=tske5wxrUKZsbAbp"

Weather Lookup, secured with OAuth:
curl -H "Authorization: Bearer MNwqguWBakpicmV6bgsXhGL5RAqd" "http://localhost:10010/weather_secure?city=Kinston,NC"
```

Hit the OAuth-secured API Proxy with the token:

```bash
$ curl -H "Authorization: Bearer MNwqguWBakpicmV6bgsXhGL5RAqd" "http://localhost:10010/weather_secure?city=Kinston,NC"
```
Hit the OAuth-secured API Proxy with an invalid token:

```bash
$ curl -H "Authorization: Bearer foobar" "http://localhost:10010/weather_secure?city=Kinston,NC"
{"error_description":"","error":"invalid_token"}%
```

Get a new Token:

```bash
$ curl -X POST "http://localhost:10010/accesstoken" -d "grant_type=client_credentials&client_id=k6l4TO4DsnQr72LdAIZAxWVZKhXhfM5I&client_secret=tske5wxrUKZsbAbp"
```

If you would like to see the interaction that Volos.js libraries have with Apigee Edge you can use the [Trace Tool](http://apigee.com/docs/gateway-services/content/using-trace-tool-0) and start a trace session on the `apigee-remote-proxy`.
