FROM registry.access.redhat.com/ubi8/nodejs-24

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
# Names the Sentry release the client reports; must match the release the
# production workflow uploads sourcemaps to, or stack traces stay minified.
ARG VITE_SENTRY_RELEASE
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE

# Setup
COPY package* ./
COPY .npmrc ./
RUN npm ci -f --omit-dev --ignore-scripts
COPY . .

RUN npm run build

EXPOSE 7000

CMD ["npm", "start"]
