const winston = require('winston')
const LokiTransport = require('winston-loki')

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

  // Safe stringify that handles circular references and errors
  const safeStringify = (obj) => {
    const seen = new WeakSet()
    return JSON.stringify(obj, (_key, value) => {
      // Handle Error objects specifically
      if (value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          name: value.name,
          ...(value.code && { code: value.code })
        }
      }
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
      }
      return value
    })
  }

  const prodFormat = winston.format.printf(({ level, ...rest }) =>
    safeStringify({
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
}

const logger = winston.createLogger({ transports })

module.exports = logger
