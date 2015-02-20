Example of using Apigee-127 for a simple proxy
===============================================

Usage
-----

1. Change the `proxyBase` property in the [config/default.yaml]() file to the base of your proxy target.

2. Create an Apigee Remote Proxy service named "RemoteProxy" and bind it to the project. (Alternatively, edit your
[api/swagger/swagger.yaml]() file to point to match your proxy service name and bind that.)

2. Start the app using `a127 project start`.

3. All requests sent to this proxy will be subjected to the Volos services you place on the proxy before being
forwarded, in total (including query params, headers, and body), to the target at the same path you used in the
original request. All requests will require a valid Apigee API Key in the api_key parameter of the query string.

4. Have fun!
