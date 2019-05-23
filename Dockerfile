FROM node:10.15
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN mkdir reports

EXPOSE 6060

CMD ["npm", "run", "execute"]
