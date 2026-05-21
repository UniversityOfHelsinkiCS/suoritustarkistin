FROM cypress/base:14.7.0

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app

COPY package* ./

RUN npm ci

COPY . .

RUN npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
