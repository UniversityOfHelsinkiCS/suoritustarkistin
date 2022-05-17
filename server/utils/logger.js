const winston = require('winston')

const transports = []

transports.push(
  new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    )
  })
)

const logger = winston.createLogger({ transports })

module.exports = logger
