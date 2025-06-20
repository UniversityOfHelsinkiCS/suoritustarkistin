FROM cypress/base:14.21.1

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app

COPY package* ./

RUN npm install --production=false

COPY . .

RUN npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
