const crypto = require('crypto')

const logger = require('@server/utils/logger')

const API = 'moocfi'

const ENDPOINTS = [
  '/persons/resolve-by-student-numbers',
  '/enrolments/resolve',
  '/enrolments/list-by-course',
  '/attainments/import',
  '/attainments/verify',
  '/course-codes/validate'
]

const endpointLabel = (path) => {
  const normalized = (path || '').split('?')[0].replace(/\/+$/, '')
  return ENDPOINTS.find((known) => normalized.endsWith(known)) || 'other'
}

const moocfiLogger = (path) => {
  const endpoint = endpointLabel(path)
  const requestId = crypto.randomBytes(8).toString('hex')

  const write = (level, message, fields) => {
    logger[level]({ ...fields, message, api: API, endpoint, requestId })
  }

  return {
    requestId,
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields)
  }
}

module.exports = { moocfiLogger, endpointLabel, ENDPOINTS, API }
