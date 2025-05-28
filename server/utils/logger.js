const os = require('os')

const winston = require('winston')
const LokiTransport = require('winston-loki')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')

const { NODE_ENV } = process.env
const { combine, timestamp, printf, splat } = winston.format

const LOKI_HOST = 'http://loki-svc.toska-lokki.svc.cluster.local:3100'

const transports = []

if (NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}

if (NODE_ENV !== 'production') {
  const devFormat = printf(
    ({ level, message, timestamp, ...rest }) => `${timestamp} ${level}: ${message} ${JSON.stringify(rest)}`
  )

  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: combine(splat(), timestamp(), devFormat)
    })
  )
}

if (NODE_ENV === 'production') {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  }

  const prodFormat = winston.format.printf(({ level, ...rest }) =>
    JSON.stringify({
      level: levels[level],
      ...rest
    })
  )
  transports.push(new winston.transports.Console({ format: prodFormat }))

  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      labels: { app: 'suotar', environment: process.env.NODE_ENV || 'production' }
    })
  )

  transports.push(
    new WinstonGelfTransporter({
      handleExceptions: true,
      host: 'svm-116.cs.helsinki.fi',
      port: 9503,
      protocol: 'udp',
      hostName: os.hostname(),
      additional: {
        app: 'suotar',
        environment: 'production'
      }
    })
  )
}

const logger = winston.createLogger({ transports })

module.exports = logger
