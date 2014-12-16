# Programmatic Access to a127 Services

## What is this?
This is a sample project for a127 which shows how you can use services defined in an a127 project (Swagger spec) programmatically in your Controller files (API Implementation).

##Defining Service Configurations
a127 makes it easy to define resource configurations to be used in policies such as Caching and Quota.  These can easily be added to operations in the Swagger spec by using annotations.  Here is a snippet from a Swagger spec where the resources are declared:

```yaml
x-a127-services:
  mycache:
    provider: volos-cache-memory
    options:
      name: name
      ttl: 5000
```

In this snippet a resource is declared which is named ‘mycache’ which represents a 5s in-memory cache service.  We will interact with this service ahortly.

##Applying Services as a Policy
Once these services are defined in the swagger file they can be applied to an API endpoint and/or used programmatically.  The cache and quota services can easily be applied to an operation by using the x-a127-apply annotation (the legaxy x-volos-apply is still supported).  Here’s an example:

```yaml
 /weather_cache:
    x-swagger-router-controller: weather
    x-a127-apply:
      mycache: {}
```

For more detailed information about using Caching as a policy look here https://github.com/apigee-127/a127-documentation/wiki/Quick-Start:-Add-Caching.

##Accessing Services Programmatically 
In addition to applying these policies to operations in your Swagger spec you can also access the underlying services directly in your controllers.  All services defined in the x-a127-services section of the Swagger spec can be accessed programmatically in the following manner:

```javascript
var resource = req.a127.resource({resource_name})
// where resource_name is the name of the resource such as ‘mycache’
```

To see example code for caching check out this sample: https://github.com/apigee-127/a127-samples/tree/master/a127-cache-programmatic 

###Cache Service
You can then use the handle to manipulate the cache entries programmatically.  This can be useful when you want to do things like the following:
Manage a cache manually to either populate entries or invalidate entries manually
Invalidate cache entries based on custom logic, or across API calls
Use a cache that is separate from an API response cache (different resource names)
Use an in-memory cache for some things and a Redis-backed cache for other things

For a complete reference to the programmatic cache API please look here: https://github.com/apigee-127/volos/tree/master/cache/common

The Cache service has a typical get/set interface:
```javascript
cache.set('key', 'value');
cache.get('key', callback);
cache.delete('key', callback);
cache.clear(callback);
```

Here is a sample controller function showing how you can use the cache to do a manual response cache:

```javascript
module.exports.get = function(req, res) {

  var city = req.swagger.params.city.value;
  var url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial";

  // get a pointer to the cache service
  var cache = req.a127.resource('mycache');

  // check to make sure we have the pointer
  if (cache) {

    // perform the 'get' with the key of the city parameter value, with the callback
    cache.get(city, function (err, data) {
      if (err) {
        // if there was an error in the cache return 500 for simplicity
        res.status(500).send(err)
      }

      // if there is a cache hit, return the response from the cache
      else if (data) {
        console.log('Cache hit!');
        res.json(data);
      }

      // if there is a cache miss, call the target API
      else {
        console.log('Cache miss!');
        console.log('-+- Executing request: ' + url);

        request.get(url, function (err, response, body) {
          // if the target API fails, return an error
          if (err) {
            res.status(500).send(err)
          }

          else {
            // set the entry in the cache using the response body and the city name
            cache.set(city, body, function (err) {
              if (err) {
                // return an error if the cache fails
                res.status(500).send(err)
              }
              else {
                // return the response to the API caller
                res.send(body);
              }
            });
          }
        });
      }
    });
  }
  // not able to get a pointer to the cache
  else {
    console.log('Cache not found!');
    request.get(url).pipe(res);
  }
};
```

This code is available here: https://github.com/apigee-127/a127-samples/blob/master/a127-cache-programmatic/api/controllers/weather.js.  This example shows you how you could manually implement a response cache.  However, a127 makes it easy to do it so this is just for the sake of example.

##What’s the point?
In addition to using the services defined in a127 as policies you can use them manually.  You can also define multiple caches if you want - one for policy usage and one for programmatic usage:

```yaml
x-a127-services:
  policyCache:
    provider: volos-cache-memory
    options:
      name: name
      ttl: 5000
  appCache:
    provider: volos-cache-memory
    options:
      name: name
      ttl: 5000
```

You can also manually invalidate cache entries as part of your operational procedures, for example if a value is stale and you need to pull an update from the target system on the next call.  Here is a snippet where you can check the value stored in the cache for a specific key:

```javascript
module.exports.get = function (req, res) {
  // get a handle to the cache
  var cache = req.a127.resource('mycache');

  // read the value of the key parameter
  var key = req.swagger.params.key.value;

  // make sure the handle is valid
  if (cache) {

    // perform the cache lookup
    cache.get(key, function (err, data) {
      // return 500 for errors
      if (err) {
        res.status(500).send(err)
      }
      
      // if there is a hit, return the data
      else if (data) {
        console.log('Manual Cache hit!');
        res.status(200).send(data);
      }
    
      // otherwise the key was not found
      else {
        res.status(404).send('Key [' + key + '] not found');
      }
    });
  }
  else {
    res.status(500).send('cache not found');
  }
};
```

To see the full example showing clearing the cache and deleting keys check out this file: https://github.com/apigee-127/a127-samples/blob/master/a127-cache-programmatic/api/controllers/cache.js we show how you can work with the cache and clear the entire cache, delete specific entries and read their values. 
