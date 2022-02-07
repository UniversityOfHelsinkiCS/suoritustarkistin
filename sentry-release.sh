#!/bin/bash
export SENTRY_ORG=toska
export SENTRY_PROJECT=suotar
export SENTRY_URL=https://sentry.cs.helsinki.fi
export SENTRY_RELEASE=$(cat /SENTRY_RELEASE)
export BUNDLE_PATH='~/suoritustarkistin/main.js'


if [[ "$NODE_ENV" )) "staging" ]]; then
  BUNDLE_PATH='~/staging/suoritustarkistin/main.js'
fi

sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits --auto $SENTRY_RELEASE
sentry-cli releases files $SENTRY_RELEASE upload ./dist/main.js $BUNDLE_PATH
sentry-cli releases finalize $SENTRY_RELEASE
