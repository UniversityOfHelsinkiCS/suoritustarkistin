FROM cypress/included:cypress-15.18.0-node-24.17.0-chrome-149.0.7827.155-1-ff-152.0-edge-149.0.4022.80-1

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app

COPY package* ./

RUN npm ci

COPY . .

RUN npm run test:build

EXPOSE 8001

ENTRYPOINT []
CMD ["npm", "run", "start:ci"]
