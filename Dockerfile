FROM node:10.15

# Set timezone to Europe/Helsinki
RUN echo "Europe/Helsinki" > /etc/timezone
RUN dpkg-reconfigure -f noninteractive tzdata

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH

# Setup
WORKDIR /usr/src/app
COPY package* ./

RUN npm ci --only=production

COPY . .
RUN curl -sL https://sentry.io/get-cli/ | bash && \
    SENTRY_RELEASE=$(sentry-cli releases propose-version) && \
    echo "${SENTRY_RELEASE}" > /SENTRY_RELEASE && \
    SENTRY_RELEASE="${SENTRY_RELEASE}" npm run build

CMD ["npm", "start"]