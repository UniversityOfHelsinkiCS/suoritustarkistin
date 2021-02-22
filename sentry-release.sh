#!/bin/bash
export SENTRY_ORG=toska
SENTRY_PROJECT=suotar


SENTRY_RELEASE=$(cat /SENTRY_RELEASE)
sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits --auto $SENTRY_RELEASE
sentry-cli releases files $SENTRY_RELEASE upload ./dist/main.js '/suoritustarkistin/main.js'
sentry-cli releases finalize $SENTRY_RELEASE
