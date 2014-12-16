# Programmatic Access to a127 Services

## What is this?
This is a sample project for a127 which shows how you can use services defined in an a127 project (Swagger spec) programmatically in your Controller files (API Implementation).

##Defining Service Configurations
a127 users a Service Provider Interface to wire services at runtime and makes them available to be applied as a policy (caching, quota) or to be used manually/programmatically in source code.  

Here is an exmaple of how services are defined in a Swagger spec using the `x-a127-services` annotation:

```
x-a127-config:
  organization: &organization CONFIGURED
  username: &username CONFIGURED
  password: &password CONFIGURED
x-a127-services:
  mycache:
    provider: volos-cache-memory
    options:
      name: name
      ttl: 5000
  myquota:
    provider: volos-quota-memory
    options:
      timeUnit: minute
      interval: 1
      allow: 2
  apigeemanagement:
    provider: volos-management-apigee
    options:
      organization: *organization
      user: *username
      password: *password
```

In this snippet three resources are defined:

* A resource named ‘mycache’ which represents a 5s in-memory cache service
* A resource named ‘myquota’ which represents a 2-request per-minute quota service
* A resource named ‘apigeemanagement’ which represents a service that you can use to interact with the Apigee management API 

##Applying Services as a Policy
Once these services are defined in the swagger file they can be applied to an API endpoint and/or used programmatically.  The cache and quota services can easily be applied to an operation by using the `x-a127-apply annotation` (the legaxy `x-volos-apply` is still supported).  Here’s an example:

```
/weather_quota:
    x-swagger-router-controller: weather
    x-a127-apply:
      mycache: {}
      myquota: {}
```
The links below provide a closer look at the details for:

* Caching as a policy: [https://github.com/apigee-127/a127-documentation/wiki/Quick-Start:-Add-Caching](https://github.com/apigee-127/a127-documentation/wiki/Quick-Start:-Add-Caching)
* Quota as a policy: [https://github.com/apigee-127/a127-documentation/wiki/Quick-Start:-Add-Quota](https://github.com/apigee-127/a127-documentation/wiki/Quick-Start:-Add-Quota)

##Accessing Services Programmatically 
In addition to applying these policies to operations in your Swagger spec you can also access the underlying services directly in your controllers.  All services defined in the x-a127-services section of the Swagger spec can be accessed programmatically in the following manner:

```
var resource = req.a127.resource({resource_name})
// where {resource_name} is the name of the resource such as ‘mycache’ or ‘myquota’
```

Here is a full snippet showing an example of using the cache service:

```
function getWeatherByCity(req, res) {
  var cache = req.a127.resource('mycache');

  var city = req.swagger.params.city.value;
  var url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial";

  console.log('Executing request: ' + url);

  // check to make sure you have a pointer to the cache
  if (cache) {
  	
  	// using 'city' as a key perform a get on the cache.  The function will be executed and receive a value in the 'data' parameter if there is a cache hit
    cache.get(city, function (err, data) {
      // for simplicity if there is an error accessing the cache return an error
      if (err) {
        res.status(500).send(err)
      }

	  // if there is a cache hit, return the data as JSON in the response
      else if (data) {
        console.log('Cache hit!');
        res.json(data);
      }
      
      // if there is a cache miss, perform the API call
      else {
        request.get(url, function (err, response, body) {
          if (err) {
            res.status(500).send(err)
          }
          // if the request is successful store the result in the cache and return the response
          else {
            console.log('Cache miss!');
            cache.set(city, body, function (err, data) {
              if (err) {
                res.status(500).send(err)
              }

              else {
                res.send(data);
              }
            });
          }
        });
      }
    });
  }
  else {
    console.log('Cache not found!');
    request.get(url).pipe(res);
  }
```

