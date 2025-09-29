#!/bin/bash

# Start the first process
npm run genkit:start-prod &

# Start the second process
npm run start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
