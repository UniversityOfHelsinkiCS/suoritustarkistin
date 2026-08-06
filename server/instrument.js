const Sentry = require('@sentry/node')
const { inProduction } = require('@server/utils/common')

if (inProduction)
  Sentry.init({
    dsn: process.env.SENTRY_ADDR,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE
  })
