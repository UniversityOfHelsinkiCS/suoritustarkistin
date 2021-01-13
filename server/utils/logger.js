const winston = require('winston')
const Log2gelf = require('winston-log2gelf')

const { LOG_PORT, LOG_HOST, LOG_HOSTNAME, LOG_PATH, LOG_PROTOCOL, NODE_ENV } = process.env

const transports = []

if (LOG_PORT && LOG_HOST) {
  transports.push(
    new Log2gelf({
      hostname: LOG_HOSTNAME || 'suotar',
      host: LOG_HOST,
      port: LOG_PORT,
      protocol: LOG_PROTOCOL || 'https',
      environment: NODE_ENV,
      service: 'SUOTAR',
      protocolOptions: {
        path: LOG_PATH || '/gelf'
      }
    })
  )
}

transports.push(
  new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  })
)

const logger = winston.createLogger({ transports })

module.exports = logger
