#!/bin/sh
count=${1-"10"}
for i in $(seq ${count})
do
	curl http://localhost:10010/weather_cached?city=Kinston,NC 
done
