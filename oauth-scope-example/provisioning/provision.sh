echo "Do you want to run now? ([yes]/no):"

read provision

if [ -z $provision ] || [ "$provision" = "yes" ]; then
	echo "Clearing old data"
	sh ./cleanup.sh
	sh ./setup.sh $1
else
	echo "Make sure you provision the ApiProducts and Developers, before testing"
fi

echo "Deployment Completed"
