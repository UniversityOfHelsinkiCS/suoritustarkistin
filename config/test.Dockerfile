FROM cypress/base:14.7.0

# Set timezone to Europe/Helsinki
RUN echo "Europe/Helsinki" > /etc/timezone
RUN dpkg-reconfigure -f noninteractive tzdata

# Setup
WORKDIR /usr/src/app

COPY package* ./

RUN npm install --production=false

COPY . .

RUN npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
