const winston = require('winston')
const LokiTransport = require('winston-loki')
const safeStringify = require('safe-stable-stringify')

const { inProduction, LOKI_HOST } = require('@server/utils/common')

const { combine, errors, json, timestamp, printf } = winston.format

const prodFormat = json()

const devFormat = printf(({ level, message, timestamp, ...rest }) => {
  const meta = Object.keys(rest).length ? ` ${safeStringify(rest)}` : ''
  return `${timestamp} ${level}: ${message}${meta}`
})

const logger = winston.createLogger({
  // Without it, logger.error(err) loses both the message and the stack
  format: errors({ stack: true }),
  transports: inProduction
    ? [
        new winston.transports.Console({ format: prodFormat }),
        new LokiTransport({
          host: LOKI_HOST,
          format: prodFormat,
          labels: { app: 'suotar', environment: 'production' }
        })
      ]
    : [new winston.transports.Console({ level: 'debug', format: combine(timestamp(), devFormat) })]
})

module.exports = logger
