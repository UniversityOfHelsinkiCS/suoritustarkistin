const webpack = require('webpack')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cron = require('node-cron')
const routes = require('@utils/routes')
const logger = require('@utils/logger')
const Sentry = require('@sentry/node')
const {
  PORT,
  inProduction,
  inDevelopment,
  SHIBBOLETH_HEADERS
} = require('@utils/common')
const { requestLogger, parseUser, currentUser } = require('./utils/middleware')
const shibbolethCharsetMiddleware = require('unfuck-utf8-headers-middleware')

const { initializeDatabaseConnection } = require('./database/connection')
const checkOodiEntries = require('./scripts/checkOodiEntries')
const { checkAllEntriesFromSisu } = require('./scripts/checkSisEntries')
const { initializeCronJobs } = require('./scripts/cronjobs')

initializeDatabaseConnection()
  .then(() => {
    const app = express()
    Sentry.init({
      dsn: process.env.SENTRY_ADDR,
      environment: process.env.NODE_ENV
    })
    app.use(Sentry.Handlers.requestHandler())
    app.use(bodyParser.json({ limit: '5mb' }))
    app.use(Sentry.Handlers.errorHandler())

    /**
     * Use hot loading when in development, else serve the static content
     */
    if (inDevelopment) {
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
      app.use('/api', routes)

      const DIST_PATH = path.resolve(__dirname, '../dist')
      const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')
      app.use(express.static(DIST_PATH))
      app.get('*', (req, res) => res.sendFile(INDEX_PATH))
    }

    initializeCronJobs()

    const now = () => new Date(Date.now())

    if (process.argv[2] && process.argv[2] === 'checkoodi') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Checking oodi entries.`
      )
      checkOodiEntries()
    }

    const STAGING = process.env.NODE_ENV === 'staging'
    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN && !STAGING) {
      cron.schedule('0 5 * * 5', () => {
        const timestamp = now()
        logger.info(
          `${timestamp.toLocaleString()} node-cron: Checking oodi entries.`
        )
        checkOodiEntries()
      })
    }

    // To be changed when Sisu is master
    if (STAGING)
      cron.schedule('0 0 * * *', () => {
        checkAllEntriesFromSisu()
      })

    app.listen(PORT, () => {
      logger.info(`Started on port ${PORT} with environment ${process.env.NODE_ENV}`)
    })
  })
  .catch((e) => {
    process.exitCode = 1
    logger.error(e)
  })
