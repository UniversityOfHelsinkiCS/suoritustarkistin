FROM cypress/base:10.15.3

ENV NODE_ENV=test

# Set timezone to Europe/Helsinki
RUN echo "Europe/Helsinki" > /etc/timezone
RUN dpkg-reconfigure -f noninteractive tzdata

# Setup
WORKDIR /usr/src/app

COPY package* ./

RUN npm ci --include=dev

COPY . .

RUN npm run test:build

EXPOSE 8001

CMD ["sh", "-c", "npm start & npm run cypress:run"]
