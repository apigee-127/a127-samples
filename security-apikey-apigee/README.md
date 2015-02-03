
* [What is this?](#whatisthis)
* [How do I use it?](#howdo)
* [Deploying your API](#deploy)
* [Run the API on Apigee](#runapigee)
* [About the project implementation](#abouthe)

## <a name="whatisthis"></a>What is this?

This is an example Apigee-127 project that shows you how to add API key security to your API. This example uses the `a127-oauth-apigee` provider, which uses Apigee Edge to handle key verification. For more details, see [API key authorization with Apigee](https://github.com/apigee-127/a127-documentation/wiki/security-apikey-apigee).

## <a name="howdo"></a>How do I use it?

#### 1) Clone this repository from Git
```bash 
$ git clone https://github.com/apigee-127/a127-samples
```

#### 2) Install npm dependencies for the project
```bash
$ cd a127-samples/security-apikey-apigee
$ npm install
```

#### 4) Create an account and a project

1. If you do not have one already, create an a127 account and project. Be sure to select the `apigee` provider when you create the account:

    `a127 account create myaccount`

    `a127 project create myproject`

2. CD to the root directory of your project:

    `cd myproject`

3. Create a RemoteProxy service and bind it to your project. See also [Understanding remote services](https://github.com/apigee-127/a127-documentation/wiki/Services).

    `a127 service create myremoteservice`

    `a127 project bind myremoteservice`

#### 3) Start your a127 API

Start your API on localhost:
```bash
        $ a127 project start
        Starting: /Users/ApigeeCorporation/Home/Dev/GITHUB/wwitman/a127-samples/security-apikey-apigee/app.js...
          project started here: http://localhost:10010
          project will restart on changes.
          to restart at any time, enter `rs`
        Creating developer a127sample@apigee.com
        Creating application A127 Sample App for developer EyWXuc2j9wwFslbk
        try this:
        curl 'http://127.0.0.1:10010/hello?name=Scott&apiKey=zBqTKxoLQRWAmfIQRSqNihqpmtgz3HR'
```

#### 4) Call the API

When the project's main file `app.js` uses [Volos.js management API](https://github.com/apigee-127/volos/tree/master/management/common) to create a developer and developer app on Apigee Edge. The developer app provides a client ID, which is used as the API key to make API calls.

Try calling the API with the curl command that is output when you start the project:

```bash
  $ curl 'http://127.0.0.1:10010/hello?name=Scott&apiKey=zBqTKxoLQRWAmfIQRSqNihqpmtgz3HR'
```

On success, the API returns "Hello, Scott". 

## <a name="deploy"></a>Deploying your API

You can deploy this sample API to Apigee and it will function the same as it does locally. 

Here are the steps for deploying to Apigee Edge:

```bash
    $ a127 project deploy --upload
```
Once your project is successfully deployed to Apigee, you will see a response like this:
```bash
    $ a127 project deploy --upload
        Deploying project apikey-apigee to wwitman-12...

        Deployed:
          name: apikey-apigee
          environment: prod
          revision: 1
          state: deployed
          basePath: /
          uris:
            - 'http://wwitman-prod.apigee.net/apikey-apigee'
            - 'https://wwitman-prod.apigee.net/apikey-apigee'

        Adding resources...
          GET /hello
        done
```
Take note of the uris that are returned. You will need these to send requests to your API later.

## <a name="runapigee"></a>Run the API on Apigee

To call the API, you can use the API key that was created when you ran the project locally. Or, you can obtain a key from any developer app registered on Apigee Edge. Log in to Edge and select Publish > Developer Apps. Select an app, and click Show next to the Consumer Key. You can copy that value and use it as your API key. 

Following this example, the API would look like this. Substitute values for your organization, environment, and API key:

```bash
    $ curl 'https://yourOrg-yourEnv.apigee.net/apikey-apigee/hello?name=Scott&apiKey=zBqTKxoLQRWAmfIQRSqNihqpmtgz3HR'
```

## <a name="aboutthe"></a>About the project implementation

For a detailed look at how this example is implemented, see [API key authorization with Apigee](https://github.com/apigee-127/a127-documentation/wiki/security-apikey-apigee).








