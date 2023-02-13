FROM registry.access.redhat.com/ubi8/nodejs-14

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# Setup
COPY package* ./
RUN npm ci -f --omit-dev --ignore-scripts
COPY . .

CMD ["npm", "start"]
