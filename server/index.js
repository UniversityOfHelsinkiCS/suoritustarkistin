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
const { bodyErrorHandler } = require('./utils/batchApi')

const { IN_MAINTENANCE } = process.env

cron.setLogger(logger.child({ source: 'node-cron' }))

// Node terminates the process on an unhandled rejection by default; log and keep running.
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

    app.use(bodyErrorHandler)

    app.use(errorMiddleware)

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

    // After every route, before the 500 handler: that one ends the request.
    Sentry.setupExpressErrorHandler(app)

    // Unmatched routes. In production the GET catch-all above answers every GET first.
    app.use((_req, res) => res.status(404).send({ error: 'Not found' }))

    // Express only treats a middleware with four arguments as an error handler, hence _next.
    app.use((err, _req, res, _next) => {
      res.status(500).send(err.toString())
    })

    if (!IN_MAINTENANCE && inProduction) initializeCronJobs()

    logger.info(
      'Suotar starting',
      inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !IN_MAINTENANCE
    )

    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !IN_MAINTENANCE) {
      logger.info('Suotar: Starting cron jobs')

      const missedExecutionTolerance = 10 * 60 * 1000

      cron.schedule(
        '30 17 * * *',
        () => {
          logger.info('Suotar: Checking all entries from Sisu cron')
          checkAllEntriesFromSisu()
        },
        { missedExecutionTolerance }
      )

      cron.schedule(
        '30 4 * * *',
        () => {
          logger.info('Suotar: Checking registered for mooc cron')
          checkRegisteredForMooc()
        },
        { missedExecutionTolerance }
      )

      cron.schedule(
        '31 4 * * *',
        () => {
          logger.info('Suotar: Checking registered for newmooc cron')
          checkRegisteredForNewMooc()
        },
        { missedExecutionTolerance }
      )
    }

    // In dev and test the Vite dev server takes PORT, the only one compose publishes, and
    // proxies /api to express one port above. In production express serves the build on PORT.
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
