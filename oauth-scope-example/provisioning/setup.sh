#!/bin/sh

source ./setenv.sh

echo "Enter your password for the Apigee Enterprise organization, followed by [ENTER]:"

read -s password

echo using $username and $org

# Install API Products

sh ./setProxy.sh $1

curl -u $username:$password $url/v1/o/$org/apiproducts \
  -H "Content-Type: application/json" -X POST -T FreeProduct.json

curl -u $username:$password $url/v1/o/$org/apiproducts \
  -H "Content-Type: application/json" -X POST -T CheapProduct.json

curl -u $username:$password $url/v1/o/$org/apiproducts \
  -H "Content-Type: application/json" -X POST -T ExpensiveProduct.json

mv FreeProduct.json.orig FreeProduct.json
mv CheapProduct.json.orig CheapProduct.json
mv ExpensiveProduct.json.orig ExpensiveProduct.json

# Create developers

curl -u $username:$password $url/v1/o/$org/developers \
  -H "Content-Type: application/xml" -X POST -T jdoe.xml

# Create apps

curl -u $username:$password \
  $url/v1/o/$org/developers/jdoe@example.com/apps \
  -H "Content-Type: application/xml" -X POST -T jdoe-app.xml

# Get consumer key and attach API product
# Do this in a quick and clean way that doesn't require python or anything

key=`curl -u $username:$password -H "Accept: application/json" \
     $url/v1/o/$org/developers/jdoe@example.com/apps/jdoe-app 2>/dev/null \
     | grep consumerKey | awk -F '\"' '{ print $4 }'`

curl -u $username:$password \
  $url/v1/o/$org/developers/jdoe@example.com/apps/jdoe-app/keys/${key} \
  -H "Content-Type: application/xml" -X POST -T jdoe-app-product.xml

key=`curl -u $username:$password -H "Accept: application/json"\
     $url/v1/o/$org/developers/jdoe@example.com/apps/jdoe-app 2>/dev/null \
     | grep consumerKey | awk -F '\"' '{ print $4 }'`

secret=`curl -u $username:$password -H "Accept: application/json"\
     $url/v1/o/$org/developers/jdoe@example.com/apps/jdoe-app 2>/dev/null \
     | grep consumerSecret | awk -F '\"' '{ print $4 }'`

echo "\n"
echo "Consumer ID for jdoe-app is: ${key}"
echo "Consumer Secret for jdoe-app is: ${secret}\n"
