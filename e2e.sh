#!/bin/bash

docker-compose -f docker-compose.e2e.yml exec e2e-db dropdb -U postgres postgres
docker-compose -f docker-compose.e2e.yml exec e2e-db createdb -U postgres postgres

node index.js &
npm run cypress:run