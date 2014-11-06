## What is this?

This is an example Apigee-127 project that shows you how to use response caching. API responses can be cached in-memory, with Redis, or with Apigee.

## What is caching?

Caching API responses is an easy way to improve the performance of your a127 API by returning the cached response or common requests, rather than forming a new response every time the same request is executed. This is particularly helpful if your API calls other third-party APIs or data sources to construct its responses.

## How do I use it?

#### 1) Clone this repository from Git
```bash 
$ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
$ cd a127-samples/cache-example
$ npm install
```

#### 3) Uncomment one of the cache providers in the a127 project swagger file with the swagger editor
    - Open the Swagger editor:
```bash
$ a127 project edit
```
    - Uncomment one provider under x-volos-resources, e.g.:
```yaml
x-volos-resources:
  #Defines our cache
  cache:
      ## Uncomment one cache provider
      provider: volos-cache-apigee
      #provider: volos-cache-memory
      #provider: volos-cache-redis
      options:
        name: weather-cache
        ttl: 30000
```

#### 4) Start your a127 API

**Apigee caching:**

- Create an Account configuration using `a127 account create`:
- Deploy your project to Apigee:
```bash
$ a127 project deploy
```
Once your project is successfully deployed to Apigee, you will see a response like this:
```bash
name: cache-sample
environment: test
revision: 2
state: deployed
basePath: /
uris:
  - 'http://amuramoto-test.apigee.net/cache-sample'
  - 'https://amuramoto-test.apigee.net/cache-sample'
```
Take note of the uris that are returned. You will need these to send requests to your API later.

**Redis caching:**

- Run the following to download Redis and create a Redis instance running on localhost:
```bash
$ sh redis.sh
``` 
- Start your API on localhost:
```bash
$ a127 project start
```

**In-memory caching:**

Start your API on localhost:
```bash
$ a127 project start
```

#### 5) Issue curl commands or use Postman to hit the API.

The first time you send the request the response will be cached. The cached response will persist for 60 seconds.

**Apigee caching:**

Note that you will need to use the URL provided when you ran 'a127 project deploy'
```bash
$ curl http://yourApigeeOrg-test.apigee.net/cache-sample/weather?city=Kinston,NC
```

**Redis or in-memory caching:**
```bash
$ curl http://localhost:10010/weather?city=Kinston,NC
```