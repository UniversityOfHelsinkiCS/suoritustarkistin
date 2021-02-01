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
const {
  processEoai,
  processBuildingai,
  processCybsec1,
  processCybsec2,
  processCybsec3,
  processCybsec1_2020,
  processCybsec2_2020,
  processCybsec3_2020,
  processCybsec4,
  processCybsec5,
  processCybsec6,
  processOhPe,
  processOhJa,
  processOhPePython,
  processOhPePythonSyksy,
  processOhPeEnglish,
  processTiTo
} = require('./scripts/moocScripts')
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

    if (process.argv[2] && process.argv[2] === 'eoai') {
      processEoai()
    }

    if (process.argv[2] && process.argv[2] === 'buildingai') {
      processBuildingai()
    }

    if (process.argv[2] && process.argv[2] === 'checkoodi') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Checking oodi entries.`
      )
      checkOodiEntries()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec1') {
      processCybsec1()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec2') {
      processCybsec2()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec3') {
      processCybsec3()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec1_2020') {
      processCybsec1_2020()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec2_2020') {
      processCybsec2_2020()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec3_2020') {
      processCybsec3_2020()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec4') {
      processCybsec4()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec5') {
      processCybsec5()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec6') {
      processCybsec6()
    }

    if (process.argv[2] && process.argv[2] === 'ohpe') {
      processOhPe()
    }

    if (process.argv[2] && process.argv[2] === 'ohpepython') {
      processOhPePython()
    }

    if (process.argv[2] && process.argv[2] === 'ohpepythonsyksy') {
      processOhPePythonSyksy()
    }

    if (process.argv[2] && process.argv[2] === 'ohpeenglish') {
      processOhPeEnglish()
    }

    if (process.argv[2] && process.argv[2] === 'ohja') {
      processOhJa()
    }
    if (process.argv[2] && process.argv[2] === 'tito') {
      processTiTo()
    }

    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN) {
      cron.schedule('0 4 * * 4', () => {
        processEoai()
      })

      cron.schedule('15 4 * * 4', () => {
        processOhPe()
      })

      cron.schedule('20 4 * * 4', () => {
        processOhJa()
      })

      cron.schedule('30 4 * * 4', () => {
        processCybsec1()
      })

      cron.schedule('35 4 * * 4', () => {
        processCybsec2()
      })

      cron.schedule('40 4 * * 4', () => {
        processCybsec3()
      })

      cron.schedule('10 5 * * 4', () => {
        processCybsec1_2020()
      })

      cron.schedule('15 5 * * 4', () => {
        processCybsec2_2020()
      })

      cron.schedule('20 5 * * 4', () => {
        processCybsec3_2020()
      })

      cron.schedule('25 5 * * 4', () => {
        processOhPePythonSyksy()
      })

      cron.schedule('30 5 * * 4', () => {
        processOhPeEnglish()
      })

      cron.schedule('35 5 * * 4', () => {
        processBuildingai()
      })

      cron.schedule('45 4 * * 4', () => {
        processCybsec4()
      })

      cron.schedule('50 4 * * 4', () => {
        processCybsec5()
      })

      cron.schedule('55 4 * * 4', () => {
        processCybsec6()
      })

      cron.schedule('0 5 * * 4', () => {
        processOhPePython()
      })

      cron.schedule('5 5 * * 4', () => {
        processTiTo()
      })

      cron.schedule('0 3 * * 5', () => {
        const timestamp = now()
        logger.info(
          `${timestamp.toLocaleString()} node-cron: Checking oodi entries.`
        )
        checkOodiEntries()
      })
    }

    // To be changed when Sisu is master
    if (process.env.NODE_ENV === 'staging')
      cron.schedule('0 0 * * *', () => {
        checkAllEntriesFromSisu()
      })

    app.listen(PORT, () => {
      logger.info(`Started on port ${PORT}`)
    })
  })
  .catch((e) => {
    process.exitCode = 1
    logger.error(e)
  })
