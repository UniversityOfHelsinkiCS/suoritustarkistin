FROM node:20

WORKDIR /usr/src/app
COPY package* ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
