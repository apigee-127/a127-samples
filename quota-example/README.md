
* [What is this?](#whatisthis)
* [What is a quota?](#whatis)
* [How do I use it?](#howdo)
* [About the helper function](#helper)

## <a name="whatisthis"></a>What is this?

This is an example Apigee-127 project that shows you how to add a quota policy to your API. 

This example also uses a helper function in `/helpers/volos.js` to grab the IP address of the incoming client request and use it as the quota key. See [About the helper function](#helper) for more information.

## <a name="whatis"></a>What is a quota?

Use a quota to configure the number of request messages that an app is allowed to submit to an API over the course of an hour, day, week, or month.

#### When to use a quota

Limit the number of connections apps can make to your API proxy's target backend over a specific period of time.

Quota is typically used to enforce business contracts or SLAs with developers and partners, rather than for operational traffic management. For example, you may have one quota set for paying customers and another for "freemium" (non-paying) users.

#### When not to use a quota

Don't use it to protect your API proxy against traffic spikes. For that, use a [spike arrest policy](https://github.com/apigee-127/a127-samples/tree/master/spikearrest-example).

#### Important to know about quotas

A quota enforces consumption limits on client apps by maintaining a distributed 'counter' that tallies incoming requests. The counter can tally API calls for any identifiable entity, including apps, developers, API keys, access tokens, and so on. Usually, API keys are used to identify client apps. In this example, we show how to enforce a quota based on the incoming client IP address. 

Quota can be computationally expensive so, for high-traffic APIs, it should configured for longer time intervals, such as a day or month. 

## <a name="howdo"></a>How do I use it?

#### 1) Clone this repository from Git
```bash 
$ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
$ cd a127-samples/quota-example
$ npm install
```

#### 3) Uncomment one of the quota providers in the a127 project swagger file with the swagger editor

- Open the Swagger editor:

```bash
$ a127 project edit
```

- Uncomment one provider under `x-volos-resources`, e.g.:

```yaml
      x-volos-resources:
        ## Add the quota module
        quota:
          ## Uncomment one quota provider
          provider: "volos-quota-memory"
          #provider: "volos-quota-redis"
          #provider: "volos-quota-apigee"
          options:
            timeUnit: "minute"
            interval: 1
            allow: 3
```

#### 4) Start your a127 API

**If using the Apigee quota provider:**

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
name: quota-sample
environment: test
revision: 2
state: deployed
basePath: /
uris:
  - 'http://yourApigeeOrg-test.apigee.net/quota-sample'
  - 'https://yourApigeeOrg-test.apigee.net/quuota-sample'
```

Take note of the uris that are returned. You will need them to call the API later in this example. 

**If using the Redis quota provider:**

- Run the following to download Redis and create a Redis instance running on localhost:

```bash
    $ sh redis.sh
```

- Start your API on localhost:

```bash
    $ a127 project start
```

**If using the In-memory quota provider:**

Start your API on localhost:

```bash
$ a127 project start
```


#### 5) Issue curl commands or use Postman to hit the API

Try calling the API in rapid succession to see the effect of this policy.

```bash
$ curl http://localhost:10010/weather?city=Kinston,NC
```

The quota is configured to allow three calls in a minute. If you kept the default configuration, you'll notice that the first three API calls succeed. The fourth (as long as you made the calls in under a minute) throws an error: `Error: exceeded quota`.


## <a name="aboutthe"></a>About the helper function

Helpers let you add additional functionality to your API. You place helper functions in Node.js files in the `/helpers` directory. 

Our example uses a helper function to retrieve the client IP address (IP where the API call originated). The result of the function (the IP address) is then used as the quota "key". 

Here's our function, in the `/helpers/volos.js` file:

```javascript
    module.exports = {
      clientIp: clientIp
    };

    function clientIp(req) {
      var key = req.connection.remoteAddress;
      console.log('clientIp Key: ' + key);
      if (debug.enabled) { debug('clientIp Key: '+key); }
      return key;
    }
```

Think of the key as representing a bucket of quota counts. In this example, a request from a client IP will go in its own separate bucket. Other IP addresses will be assigned to their own buckets.

We apply the helper function in the `swagger.yaml` file when we apply the quota, as follows:

``` yaml
    x-volos-apply:
        quota:
          key:
            helper: volos
            function: clientIp
```

Now, quota counts will be maintained separately for each incoming client IP.

## Related information

For a comparison of rate limiting policies, see Comparing rate limit policies on the Apigee-127 documentation wiki. 






