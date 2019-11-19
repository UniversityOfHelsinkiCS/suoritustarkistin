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
const processEoaiCompletions = require('./scripts/processEoaiCompletions')
const checkOodiEntries = require('./scripts/checkOodiEntries')
const processMoocCompletions = require('./scripts/processMoocCompletions')

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

    if (process.argv[2] && process.argv[2] === 'processeoai') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Processing new EoAI completions.`
      )
      processEoaiCompletions(['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv'])
    }

    if (process.argv[2] && process.argv[2] === 'checkoodi') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Checking oodi entries.`
      )
      checkOodiEntries()
    }

    if (process.argv[2] && process.argv[2] === 'cybsec1') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Processing new cybsec1 completions.`
      )
      processMoocCompletions(
        'AY5823951',
        'Open uni: Cyber Security Base: Introduction to Cyber Security',
        '1,0',
        process.env.CYBSEC_TEACHERCODE,
        '37786'
      )
    }

    if (process.argv[2] && process.argv[2] === 'cybsec2') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Processing new cybsec2 completions.`
      )
      processMoocCompletions(
        'AY5823952',
        'Open uni: Cyber Security Base: Securing Software',
        '3,0',
        process.env.CYBSEC_TEACHERCODE,
        '37787'
      )
    }

    if (process.argv[2] && process.argv[2] === 'cybsec3') {
      const timestamp = now()
      logger.info(
        `${timestamp.toLocaleString()} manual run: Processing new cybsec3 completions.`
      )
      processMoocCompletions(
        'AY5823953',
        'Open uni: Cyber Security Base: Course Project I',
        '1,0',
        process.env.CYBSEC_TEACHERCODE,
        '37788'
      )
    }

    if (inProduction && process.env.EDUWEB_TOKEN && process.env.MOOC_TOKEN) {
      cron.schedule('0 4 * * 4', () => {
        const timestamp = now()
        logger.info(
          `${timestamp.toLocaleString()} node-cron: Processing new EoAI completions.`
        )
        processEoaiCompletions(['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv'])
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
