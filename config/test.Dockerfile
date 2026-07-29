FROM cypress/base:24.18.0

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app

COPY package* ./
COPY .npmrc ./

RUN npm ci
RUN npx cypress install

COPY . .

RUN NODE_ENV=production npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
