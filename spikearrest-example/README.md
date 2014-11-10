## What is this?

This is an example Apigee-127 project that shows you how to add a spike arrest policy to your API. 

## What is spike arrest?

A spike arrest policy protects against traffic spikes and offers protection against threats such as denial of service attacks. It throttles the number of requests an API can process by "smoothing" the number of calls that can be processed over a specified time interval. 

## How do I use it?

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

If you kept the default configuration, you'll notice that you are only able to call the API about once every 6 seconds. This is because the policy allows 10 calls in a one-minute interval, and it "smooths" the calls out so they are evenly distributed through the interval. For details on the algorithm involved, see  "[How does spike arrest work?](#howdoes)" below.

## Deploying your API

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

## Run the API on Apigee

Note that you will need to use the URL provided when you ran 'a127 project deploy'

```bash
$ curl http://yourApigeeOrg-test.apigee.net/spikearrest-sample/weather?city=Kinston,NC
```

## About the default example configuration

Here's the default configuration for the spike arrest sample. First, we have the `x-volos-resources` definition. It adds spike arrest to the example project with a default configuration.

>Note: Unlike some other Volos.js modules that have "in-memory", Redis, and Apigee modes, spike arrest only has an "in-memory" mode. If you deploy to a service like Apigee Edge, spike arrest continues to function as expected.

````yaml
x-volos-resources:
  ## Add the spike arrest module
  spikearrest:
    provider: "volos-spikearrest-memory"
    options:
      timeUnit: "minute"
      allow: 10
      #bufferSize: 3
````

This configuration allows 10 API calls per one-minute interval. Actually, the feature "smooths" the number of allowed calls evenly through the interval. If you call the API repeatedly, you'll see that one call goes through every 6 seconds (60/10). If you try to call the API quicker than every 6 seconds, you'll receive a 503 response with the error message: `Error: SpikeArrest engaged`. The bufferSize is commented out by default. See "[Adding a buffer"](#addingbuffer). See also "[How does spike arrest work?](#howsoes)"

Next, we apply spike arrest to a path, where it will be invoked whenever the path is called:

````yaml
paths:
  /weather:
    x-volos-apply:
      spikearrest: {key: "foo", weight: 2}
    x-swagger-router-controller: weather
    get:
      #x-volos-apply:
        #spikearrest: {key: "foo", weight: 2}
      description: "Returns current weather in the specified city to the caller"
````

Or, spike arrest can be applied to an operation, like this, where it will be invoked when the specific operation on the path is called:

````yaml
paths:
  /weather:
    #x-volos-apply:
      #spikearrest: {key: "foo", weight: 2}
    x-swagger-router-controller: weather
    get:
      x-volos-apply:
        spikearrest: {key: "foo", weight: 2}
      description: "Returns current weather in the specified city to the caller"
````

## What's the difference between spike arrest and quota?

Quota policies configure the number of request messages that a client app is allowed to submit to an API over the course of an hour, day, week, or month. The quota policy enforces consumption limits on client apps by maintaining a distributed counter that tallies incoming requests. 

Use a quota policy to enforce business contracts or SLAs with developers and partners, rather than for operational traffic management. Use spike arrest to protect against sudden spikes in API traffic. 

## <a name="howdoes"></a>How does spike arrest work?

Think of Spike Arrest as a way to generally protect against traffic spikes rather than as a way to limit traffic to a specific number of requests. Your APIs and backend can handle a certain amount of traffic, and the spike arrest policy helps you smooth traffic to the general amounts you want.

The runtime spike arrest behavior differs from what you might expect to see from the literal per-minute or per-second values you enter.

For example, say you specify a rate of 30 requests per minute, like this:

````bash
    x-volos-resources:
      ## Add the spike arrest module
      spikearrest:
        provider: "volos-spikearrest-memory"
        options:
          timeUnit: "minute"
          allow: 30
````


In testing, you might think you could send 30 requests in 1 second, as long as they came within a minute. But that's not how the policy enforces the setting. If you think about it, 30 requests inside a 1-second period could be considered a mini spike in some environments.

What actually happens, then? To prevent spike-like behavior, spike arrest smooths the allowed traffic by dividing your settings into smaller intervals, as follows:

### Per-minute rates
Per-minute rates get smoothed into requests allowed intervals of seconds. For example, 30 requests per minute gets smoothed like this:

* 60 seconds (1 minute) / 30 = 2-second intervals, or about 1 request allowed every 2 seconds. A second request inside of 2 seconds will fail. Also, a 31st request within a minute will fail.

The configuration looks like this:

````bash
    x-volos-resources:
      ## Add the spike arrest module
      spikearrest:
        provider: "volos-spikearrest-memory"
        options:
          timeUnit: "minute"
          allow: 30
````

### Per-second rates

Per-second rates get smoothed into requests allowed in intervals of milliseconds. For example, 10 requests/second gets smoothed like this:

* 1000 milliseconds (1 second) / 10 = 100-millisecond intervals, or about 1 request allowed every 100 milliseconds . A second request inside of 100ms will fail. Also, an 11th request within a second will fail.

The configuration looks like this:

````bash
    x-volos-resources:
      ## Add the spike arrest module
      spikearrest:
        provider: "volos-spikearrest-memory"
        options:
          timeUnit: "second"
          allow: 10
````

### When the limit is exceeded

If the number of requests exeeds the limit within the specified time interval, spike alert returns this error message in a 503 response:

    Error: SpikeArrest engaged


### <a name="addingbuffer"></a>Adding a buffer

You have an option of adding a buffer to the policy. In the example's `/api/swagger/swagger.yaml` file, uncomment the line `bufferSize: 10`, and re-run the example. You'll see that the API does not return an error immediately when you exceed the spike arrest limit. Instead, requests are buffered (up to the number specified), and the buffered requests are processed as soon as the next appropriate execution window is available. The default bufferSize is 0.

````bash
    x-volos-resources:
      ## Add the spike arrest module
      spikearrest:
        provider: "volos-spikearrest-memory"
        options:
          timeUnit: "minute"
          bufferSize: 3
          allow: 30
````

### Applying spike arrest to paths or operations

You can apply spike arrest to paths or operations:

````yaml
paths:
  /weather:
    x-volos-apply:
      spikearrest: {}
    x-swagger-router-controller: weather
    get:
      #x-volos-apply:
        #spikearrest: {}
      description: "Returns current weather in the specified city to the caller"
````

You can add two optional configurations (key and weight) to spike arrest when you apply it:

````yaml
paths:
  /weather:
    x-volos-apply:
      spikearrest: {key: "foo", weight: 2}
    x-swagger-router-controller: weather
    get:
      #x-volos-apply:
        #spikearrest: {key: "foo", weight: 2}
      description: "Returns current weather in the specified city to the caller"
````


* **key** - (optional, default = '_default') Identifies the spike arrest "bucket". This is a string that may be set to any value. Each key locates a single bucket, which maintains separate execution windows from other buckets.

* **weight** - (optional, default = 1) Specifies the weighting defined for each message. Message weight is used to modify the impact of a single request on the calculation of the spike arrest limit. For example, if the Spike Arrest Rate is 10 calls per minute, and a path or operation with weight 2 is called, then only 5 messages per minute are permitted from that path or operation. In some advanced cases, API providers may want to assign different weights to different API calls.





