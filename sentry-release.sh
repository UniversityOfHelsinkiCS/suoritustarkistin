#!/bin/bash
export SENTRY_ORG=toska
export SENTRY_PROJECT=suotar
export SENTRY_URL=https://sentry.cs.helsinki.fi
export SENTRY_RELEASE=$(cat /SENTRY_RELEASE)

if [[ -z "$SENTRY_AUTH_TOKEN" ]]; then
  echo "is set"
else
    echo "is not set"
fi

sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits --auto $SENTRY_RELEASE
sentry-cli releases files $SENTRY_RELEASE upload ./dist/main.js '~/suoritustarkistin/main.js'
sentry-cli releases finalize $SENTRY_RELEASE
