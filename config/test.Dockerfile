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

# VITE_E2E stops this bundle initializing Sentry. It is built with NODE_ENV=production,
# so without the flag it is indistinguishable from the real client and would report
# test runs against the live project.
RUN NODE_ENV=production VITE_E2E=true npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
