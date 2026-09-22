/**
 * The envelope shared by every courses.mooc.fi batch endpoint: one response item per
 * request item, in request order. Per-item outcomes are always HTTP 200; only a
 * request-level failure is a 4xx.
 *
 * The codes and wording themselves live in moocfiResults.js.
 */

const _ = require('lodash')

const { moocfiLogger } = require('./moocfiLogger')
const { REQUEST_CODES, MESSAGES, ServiceUnavailableError } = require('./moocfiResults')
const { sendSentryError } = require('./sentry')

// Bounds the sequential importer round trips one request can trigger.
const MAX_BATCH_SIZE = 1000
const IMPORT_BATCH_SIZE = 100
const LIST_BY_COURSE_BATCH_SIZE = 50

const requestError = (res, status, code, message) => res.status(status).json({ error: { code, message } })

const malformedRequest = (res, message) => requestError(res, 400, REQUEST_CODES.malformedRequest, message)

/**
 * express.json rejects a bad body before routing, so this cannot live on a router. Shared
 * with the integration harness, which mounts the API the way server/index.js does.
 */
const bodyErrorHandler = (err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return malformedRequest(res, 'Request body is not valid JSON.')
  if (err?.type === 'entity.too.large') {
    return requestError(res, 413, REQUEST_CODES.requestTooLarge, MESSAGES[REQUEST_CODES.requestTooLarge])
  }
  return next(err)
}

/**
 * `handler` takes the whole batch at once so it can collapse the items into as few
 * importer calls as possible. An importer failure is request-level: the lookups are
 * batch-wide, so it leaves no per-item outcome to report, and the endpoint says so by
 * throwing the error `serviceUnavailable` builds. Anything else thrown is a bug.
 *
 * `validateItem` returns a message for an item the endpoint cannot read at all. That is a
 * request-level malformedRequest rather than a per-item error: the spec's per-item codes
 * describe outcomes for a well-formed item, so a bad shape has nothing to map onto.
 *
 * `maxBatchSize` lets an endpoint whose cost grows with the batch ask for a lower ceiling.
 */
const batchHandler =
  (handler, validateItem, maxBatchSize = MAX_BATCH_SIZE) =>
  async (req, res) => {
    const items = req.body
    const log = moocfiLogger(req.path)
    const started = Date.now()

    const batch = {
      client: req.apiKey?.name,
      items: Array.isArray(items) ? items.length : undefined
    }
    const context = () => ({ ...batch, ms: Date.now() - started })

    log.info('Received a batch', batch)

    const rejected = (reason) => {
      log.warn(`Rejected as malformed: ${reason}`, { ...context(), status: 400 })
      return malformedRequest(res, reason)
    }

    if (!Array.isArray(items)) return rejected('Request body must be a JSON array of request items.')
    if (!items.length) {
      log.info('Answered an empty batch', { ...context(), status: 200 })
      return res.status(200).json([])
    }
    if (items.length > maxBatchSize) {
      return rejected(`A batch may contain at most ${maxBatchSize} request items.`)
    }

    const invalid = items.findIndex((item) => !item || typeof item.requestItemId !== 'string' || !item.requestItemId)
    if (invalid !== -1) return rejected(`Request item at index ${invalid} has no string requestItemId.`)

    const ids = items.map(({ requestItemId }) => requestItemId)
    if (new Set(ids).size !== ids.length) return rejected('Every requestItemId in a batch must be unique.')

    if (validateItem) {
      for (const item of items) {
        const message = validateItem(item)
        if (message) return rejected(`Request item ${item.requestItemId}: ${message}`)
      }
    }

    try {
      const results = await handler(items, log)
      log.info(`Answered ${results.length} items`, {
        ...context(),
        status: 200,
        codes: _.countBy(results, 'code')
      })
      return res.status(200).json(results)
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        const code = REQUEST_CODES.serviceTemporarilyUnavailable
        log.error(`Failed: ${error.title}`, {
          ...error.context,
          ...context(),
          status: 503,
          code,
          cause: error.cause?.message,
          stack: error.cause?.stack
        })
        return requestError(res, 503, code, MESSAGES[code])
      }
      log.error(`Failed: ${error.message}`, {
        ...context(),
        status: 500,
        code: REQUEST_CODES.internalError,
        stack: error.stack
      })
      sendSentryError('Batch request failed', error, { path: req.path })
      return requestError(res, 500, REQUEST_CODES.internalError, MESSAGES[REQUEST_CODES.internalError])
    }
  }

module.exports = { MAX_BATCH_SIZE, IMPORT_BATCH_SIZE, LIST_BY_COURSE_BATCH_SIZE, bodyErrorHandler, batchHandler }
