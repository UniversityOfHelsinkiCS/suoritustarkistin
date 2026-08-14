FROM registry.access.redhat.com/ubi8/nodejs-24

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
# Names the Sentry release both sides report; must match the release the production
# workflow uploads sourcemaps to, or stack traces stay minified.
ARG SENTRY_RELEASE
# Read at runtime by server/instrument.js
ENV SENTRY_RELEASE=$SENTRY_RELEASE
# Same value under the prefix Vite requires to expose it to the client bundle, where it
# is baked in at build time rather than read at runtime
ENV VITE_SENTRY_RELEASE=$SENTRY_RELEASE

# Setup
COPY package* ./
COPY .npmrc ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

RUN npm run build

EXPOSE 7000

CMD ["npm", "start"]
