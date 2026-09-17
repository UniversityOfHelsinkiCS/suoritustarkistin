const Sentry = require('@sentry/node')
const { inProduction } = require('@server/utils/common')
const { scrubSentryEvent } = require('@server/utils/scrubSentryEvent')

if (inProduction)
  Sentry.init({
    dsn: process.env.SENTRY_ADDR,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    beforeSend: scrubSentryEvent
  })
