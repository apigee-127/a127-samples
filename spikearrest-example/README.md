
* [What is this?](#whatisthis)
* [What is spike arrest?](#whatis)
* [How do I use it?](#howdo)
* [Deploying your API](#deploy)
* [Run the API on Apigee](#runapigee)
* [About the default configuration](#abouthe)
* [Deep dive](#deepdive)

## <a name="whatisthis"></a>What is this?

This is an example Apigee-127 project that shows you how to add a spike arrest policy to your API. 

## <a name="whatis"></a>What is spike arrest?

A spike arrest policy protects against traffic spikes and offers protection against threats such as denial of service attacks. It throttles the number of requests an API can process by "smoothing" the number of calls that can be processed over a specified time interval. 

## <a name="howdo"></a>How do I use it?

#### 1) Clone this repository from Git
```bash 
$ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
$ cd a127-samples/spikearrest-example
$ npm install
```

#### 3) Start your a127 API

Start your API on localhost:
```bash
$ a127 project start
```

#### 4) Issue curl commands or use Postman to hit the API.

Try calling the API in rapid succession to see the effect of this policy.

```bash
$ curl http://localhost:10010/weather?city=Kinston,NC
```

If you kept the default configuration, you'll notice that you are only able to call the API about once every 6 seconds. This is because the policy allows 10 calls in a one-minute interval, and it "smooths" the calls out so they are evenly distributed through the interval. For details on the algorithm involved, see [Spike arrest deep dive](https://github.com/apigee-127/a127-documentation/wiki/Spike-arrest-deep-dive) on the Apigee-127 documentation wiki.

## <a name="deploy"></a>Deploying your API

You can deploy your spike-arrest protected API to Apigee or another service, and it will function the same as it does locally. 

Here are the steps for deploying to Apigee Edge:

- If you don't have an account, create one:
```bash
$ a127 account create
```

- Deploy your project to Apigee:
```bash
$ a127 project deploy
```
Once your project is successfully deployed to Apigee, you will see a response like this:
```bash
Deploying project spikearrest-example to wwitman-1...
name: spikearrest-example
environment: test
revision: 1
state: deployed
basePath: /
uris:
  - 'http://YourApigeeOrg-YourEnv.apigee.net/spikearrest-example'
  - 'https://YourApigeeOrg-YourEnv.apigee.net/spikearrest-example'
```
Take note of the uris that are returned. You will need these to send requests to your API later.

## <a name="runapigee"></a>Run the API on Apigee

Note that you will need to use the URL provided when you ran 'a127 project deploy'

```bash
$ curl http://yourApigeeOrg-test.apigee.net/spikearrest-sample/weather?city=Kinston,NC
```

## <a name="aboutthe"></a>About the default example configuration

Here's the default configuration for the spike arrest sample. Like with all Apigee-127 policies, you have to add it first, then apply it. 

First, we added spike arrest to the `x-a127-services` definition. 

>Note: Unlike some other Volos.js modules that have "in-memory", Redis, and Apigee modes, spike arrest only has an "in-memory" mode. If you deploy to a service like Apigee Edge, spike arrest continues to function as expected.

````yaml
x-127-services:
  ## Add the spike arrest module
  spikearrest:
    provider: "volos-spikearrest-memory"
    options:
      timeUnit: "minute"
      allow: 10
      #bufferSize: 3
````

This configuration allows 10 API calls per one-minute interval. Actually, the feature "smooths" the number of allowed calls evenly through the interval. If you call the API repeatedly, you'll see that one call goes through every 6 seconds (60/10). If you try to call the API quicker than every 6 seconds, you'll receive a 503 response with the error message: `Error: SpikeArrest engaged`. 

>The bufferSize is commented out by default. For information about buffers, see "Adding a buffer" in [Spike arrest deep dive](https://github.com/apigee-127/a127-documentation/wiki/Spike-arrest-deep-dive) on the Apigee-127 documentation wiki.  

Next, we apply spike arrest to a path, where it will be invoked whenever the path is called:

````yaml
paths:
  /weather:
    x-a127-apply:
      spikearrest: {}
    x-swagger-router-controller: weather
    get:
      #x-a127-apply:
        #spikearrest: {key: "foo", weight: 2}
      description: "Returns current weather in the specified city to the caller"
````

Or, spike arrest can be applied to an operation, like this, where it will be invoked when the specific operation on the path is called:

````yaml
paths:
  /weather:
    #x-a127-apply:
      #spikearrest: {key: "foo", weight: 2}
    x-swagger-router-controller: weather
    get:
      x-a127-apply:
        spikearrest: {}
      description: "Returns current weather in the specified city to the caller"
````

For a list of advanced configurations you can pass to spike arrest when you apply it, see "Advanced configurations" in the [Spike arrest deep dive](https://github.com/apigee-127/a127-documentation/wiki/Spike-arrest-deep-dive) on the Apigee-127 documentation wiki. 

## <a name="aboutthe"></a>About the helper function

Helpers let you add additional functionality to your API. You place helper functions in Node.js files in the `/helpers` directory. 

Our example uses a helper function to retrieve the client IP address (IP where the API call originated). The result of the function (the IP address) is then used as the spikearrest "key". 

Here's our function, in the `/helpers/volos.js` file:

```javascript
    module.exports = {
      clientIp: clientIp
    };

    function clientIp(req) {
      var key = req.connection.remoteAddress;
      console.log('clientIp Key: ' + key);
      return key;
    }
```

Think of the key as representing a bucket of spike arrest counts. In this example, a request from a client IP will go in its own separate bucket. Other IP addresses will be assigned to their own buckets.

We apply the helper function in the `swagger.yaml` file when we apply the spike arrest, as follows:

``` yaml
    x-a127-apply:
        spikearrest:
          key:
            helper: volos
            function: clientIp
```

Now, spike arrest counts will be maintained separately for each incoming client IP.

## Deep dive

For a deeper look at spike arrest, how it works, advanced configurations, and more, see [Spike arrest deep dive](https://github.com/apigee-127/a127-documentation/wiki/Spike-arrest-deep-dive) on the Apigee-127 documentation wiki. 

See also a comparison of quota and spike arrest in [Rate limiting](https://github.com/apigee-127/a127-documentation/wiki/Rate-limiting-comparison.md).






