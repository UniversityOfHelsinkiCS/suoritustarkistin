const webpack = require('webpack')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cron = require('node-cron')
const routes = require('@utils/routes')
const logger = require('@utils/logger')
const {
  PORT,
  inProduction,
  inDevelopment,
  SHIBBOLETH_HEADERS
} = require('@utils/common')
const { fakeShibbo } = require('./utils/fakeshibbo')
const { requestLogger, parseUser } = require('./utils/middleware')
const shibbolethCharsetMiddleware = require('unfuck-utf8-headers-middleware')

const { initializeDatabaseConnection } = require('./database/connection')
const checkOodiEntries = require('./scripts/checkOodiEntries')
const {
  processEoai,
  processCybsec1,
  processCybsec2,
  processCybsec3,
  processCybsec4,
  processCybsec5,
  processCybsec6,
  processOhPe,
  processOhJa
} = require('./scripts/moocScripts')

initializeDatabaseConnection()
  .then(() => {
    const app = express()
    app.use(bodyParser.json({ limit: '5mb' }))

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

      if (process.argv[2] && process.argv[2] === 'fakeshibbo') {
        logger.info('Using fakeshibbo headers.')
        app.use(fakeShibbo)
      }
      app.use(parseUser)
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

    const now = () => new Date(Date.now())

    if (process.argv[2] && process.argv[2] === 'eoai') {
      processEoai()
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

    if (process.argv[2] && process.argv[2] === 'ohja') {
      processOhJa()
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

      cron.schedule('45 4 * * 4', () => {
        processCybsec4()
      })

      cron.schedule('50 4 * * 4', () => {
        processCybsec5()
      })

      cron.schedule('55 4 * * 4', () => {
        processCybsec6()
      })

      cron.schedule('0 3 * * 5', () => {
        const timestamp = now()
        logger.info(
          `${timestamp.toLocaleString()} node-cron: Checking oodi entries.`
        )
        checkOodiEntries()
      })
    }

    app.listen(PORT, () => {
      logger.info(`Started on port ${PORT}`)
    })
  })
  .catch((e) => {
    process.exitCode = 1
    logger.error(e)
  })
