#!/bin/bash
export SENTRY_ORG=toska
SENTRY_PROJECT=suotar

cat ./dist/main.js


curl -sL https://sentry.io/get-cli/ | bash
SENTRY_RELEASE=$(sentry-cli releases propose-version)
sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits --auto $SENTRY_RELEASE
sentry-cli releases files $SENTRY_RELEASE upload /dist/main.js '~/main.js'
sentry-cli releases finalize $SENTRY_RELEASE
