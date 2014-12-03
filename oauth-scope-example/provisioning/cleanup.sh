#!/bin/sh

source ./setenv.sh

echo "Enter your password for the Apigee Enterprise organization, followed by [ENTER]:"

read -s password

echo using $username and $org

echo "Deleting Apps"

curl -u $username:$password $url/v1/o/$org/developers/jdoe@example.com/apps/jdoe-app -X DELETE

echo "Deleting Developers"

curl -u $username:$password $url/v1/o/$org/developers/jdoe@example.com -X DELETE

echo "Deleting Products"

curl -u $username:$password $url/v1/o/$org/apiproducts/FreeProduct -X DELETE

curl -u $username:$password $url/v1/o/$org/apiproducts/CheapProduct -X DELETE

curl -u $username:$password $url/v1/o/$org/apiproducts/ExpensiveProduct -X DELETE

echo "\nCleanup Completed\n"
