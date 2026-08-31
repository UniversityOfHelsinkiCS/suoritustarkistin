const express = require('express')
const path = require('path')
const cron = require('node-cron')
const shibbolethCharsetMiddleware = require('unfuck-utf8-headers-middleware')
const routes = require('@server/utils/routes')
const logger = require('@server/utils/logger')
const Sentry = require('@sentry/node')
const { PORT, inProduction, inDevelopment, inTest, SHIBBOLETH_HEADERS } = require('@server/utils/common')
const { requestLogger, parseUser, currentUser, errorMiddleware } = require('./utils/middleware')

const { initializeDatabaseConnection } = require('./database/connection')
const {
  checkAllEntriesFromSisu,
  checkRegisteredForMooc,
  checkRegisteredForNewMooc
} = require('./scripts/checkSisEntries')
const { initializeCronJobs } = require('./scripts/cronjobs')

const { IN_MAINTENANCE } = process.env

/**
 * Node >=15 terminates the process on an unhandled promise rejection. Node 14 only
 * warned. Log and keep running, as Node 14 did. Maybe consider a more modern pattern
 * once Node upgrade is live and stable.
 */
process.on('unhandledRejection', (reason) => {
  logger.error({
    message: 'Unhandled promise rejection',
    reason: reason instanceof Error ? reason.stack : String(reason)
  })
})

initializeDatabaseConnection()
  .then(async () => {
    const app = express()

    app.use(express.json({ limit: '5mb' }))

    // express.json rejects a bad body before routing, so this cannot live on a router.
    app.use((err, req, res, next) => {
      if (err?.type === 'entity.parse.failed')
        return res.status(400).json({ error: { code: 'malformedRequest', message: 'Request body is not valid JSON.' } })
      if (err?.type === 'entity.too.large')
        return res.status(413).json({ error: { code: 'requestTooLarge', message: 'Request body is too large.' } })
      return next(err)
    })

    app.use(errorMiddleware)

    /**
     * Use hot loading when in development, else serve the static content
     */
    if (inDevelopment || inTest) {
      app.use(parseUser)
      app.use(currentUser)
      app.use(requestLogger)
      app.use('/api', routes)
    } else {
      app.use(shibbolethCharsetMiddleware(SHIBBOLETH_HEADERS))
      app.use(parseUser)
      app.use(currentUser)
      app.use('/api', routes)

      const DIST_PATH = path.resolve(__dirname, '../dist')
      const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
      app.use(express.static(DIST_PATH))
      app.get('/{*splat}', (req, res) => res.sendFile(INDEX_PATH))
    }

    /**
     * Reports errors thrown by the routes above, then hands them on. Must sit after
     * every route and before the 500 handler at the bottom: that handler ends the
     * request, so anything registered after it never runs.
     */
    Sentry.setupExpressErrorHandler(app)

    /**
     * Anything that reaches this point matched no route. In dev and test express
     * serves nothing but /api, so this is the end of the line for a mistyped or
     * parameterless api path; in production app.get('/{*splat}') has already answered
     * every GET, so only unmatched non-GETs land here.
     */
    app.use((_req, res) => res.status(404).send({ error: 'Not found' }))

    // Express only treats a middleware as an error handler if it declares four
    // arguments, hence _next: with three, `res` here would be `next`.
    app.use((err, _req, res, _next) => {
      res.status(500).send(err.toString())
    })

    if (!IN_MAINTENANCE && inProduction) initializeCronJobs()

    const STAGING = process.env.NODE_ENV === 'staging'
    logger.info(
      'Suotar starting',
      inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !STAGING && !IN_MAINTENANCE
    )

    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !STAGING && !IN_MAINTENANCE) {
      logger.info('Suotar: Starting cron jobs')

      cron.schedule('30 17 * * *', () => {
        logger.info('Suotar: Checking all entries from Sisu cron')
        checkAllEntriesFromSisu()
      })

      cron.schedule('15 3 * * *', () => {
        logger.info('Suotar: Checking registered for mooc cron')
        checkRegisteredForMooc()
      })

      cron.schedule('15 4 * * *', () => {
        logger.info('Suotar: Checking registered for newmooc cron')
        checkRegisteredForNewMooc()
      })
    }

    /**
     * In dev and test the Vite dev server is the one the browser talks to, so it takes
     * PORT (the only port compose publishes) and proxies /api to express one port above.
     * In production the client is a static build and express serves it on PORT itself.
     */
    const apiPort = inDevelopment || inTest ? Number(PORT) + 1 : PORT

    app.listen(apiPort, () => {
      logger.info(`Suotar started on port ${apiPort} with environment ${process.env.NODE_ENV}`)
      if (IN_MAINTENANCE) logger.info(`Maintenance mode enabled for environment ${process.env.NODE_ENV}`)
    })

    if (inDevelopment || inTest) {
      // Vite 5 dropped its CommonJS Node API, hence the dynamic import
      const { createServer } = await import('vite')
      const vite = await createServer()
      await vite.listen()
      logger.info(`Vite dev server serving the client on port ${PORT}`)
    }
  })
  .catch((e) => {
    process.exitCode = 1
    logger.error({ message: `Server startup failed: ${e.message}`, stack: e.stack })
  })
