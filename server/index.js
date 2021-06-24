const webpack = require('webpack')
const express = require('express')
const path = require('path')
const cron = require('node-cron')
const routes = require('@utils/routes')
const logger = require('@utils/logger')
const Sentry = require('@sentry/node')
const {
  PORT,
  inProduction,
  inDevelopment,
  inTest,
  SHIBBOLETH_HEADERS
} = require('@utils/common')
const { requestLogger, parseUser, currentUser, errorMiddleware } = require('./utils/middleware')
const shibbolethCharsetMiddleware = require('unfuck-utf8-headers-middleware')

const { initializeDatabaseConnection } = require('./database/connection')
const { checkAllEntriesFromSisu, checkRegisteredForMooc } = require('./scripts/checkSisEntries')
const { initializeCronJobs } = require('./scripts/sisCronjobs')

const { IN_MAINTENANCE } = process.env

initializeDatabaseConnection()
  .then(() => {
    const app = express()
    Sentry.init({
      dsn: process.env.SENTRY_ADDR,
      environment: process.env.NODE_ENV
    })
    app.use(Sentry.Handlers.requestHandler())
    app.use(express.json({ limit: '5mb' }))
    app.use(errorMiddleware)


    /**
     * Use hot loading when in development, else serve the static content
     */
    if (inDevelopment || inTest) {
      /* eslint-disable */
      const middleware = require('webpack-dev-middleware')
      const hotMiddleWare = require('webpack-hot-middleware')
      const webpackConf = require('@root/webpack.config')
      /* eslint-enable */
      const compiler = webpack(
        webpackConf('development', { mode: 'development' })
      )
      const devMiddleware = middleware(compiler)

      app.use(devMiddleware)
      app.use(hotMiddleWare(compiler))

      app.use(parseUser)
      app.use(currentUser)
      app.use(requestLogger)
      app.use('/api', routes)

      app.use('*', (req, res, next) => {
        const filename = path.join(compiler.outputPath, 'index.html')
        devMiddleware.waitUntilValid(() => {
          compiler.outputFileSystem.readFile(filename, (err, result) => {
            if (err) return next(err)
            res.set('content-type', 'text/html')
            res.send(result)
            return res.end()
          })
        })
      })
    } else {
      app.use(shibbolethCharsetMiddleware(SHIBBOLETH_HEADERS))
      app.use(parseUser)
      app.use(currentUser)
      app.use('/api', routes)

      const DIST_PATH = path.resolve(__dirname, '../dist')
      const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
      app.use(express.static(DIST_PATH))
      app.get('*', (req, res) => res.sendFile(INDEX_PATH))
      app.use(Sentry.Handlers.errorHandler())
    }
    app.use((err, req, res) => {
      res.status(500).send(err.toString())
    })

    if (!IN_MAINTENANCE && inProduction)
      initializeCronJobs()

    const STAGING = process.env.NODE_ENV === 'staging'

    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !STAGING && !IN_MAINTENANCE) {
      cron.schedule('0 * * * *', () => {
        checkAllEntriesFromSisu()
      })

      cron.schedule('0 3 * * 5', () => {
        checkRegisteredForMooc()
      })
    }

    app.listen(PORT, () => {
      logger.info(`Started on port ${PORT} with environment ${process.env.NODE_ENV}`)
      if (IN_MAINTENANCE)
        logger.info(`Maintenance mode enabled for environment ${process.env.NODE_ENV}`)
    })
  })
  .catch((e) => {
    process.exitCode = 1
    logger.error(e)
  })
