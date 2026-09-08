/**
 * The envelope shared by every courses.mooc.fi batch endpoint: one response item per
 * request item, in request order. Per-item outcomes are always HTTP 200; only a
 * request-level failure is a 4xx.
 *
 * The codes and wording themselves live in moocfiResults.js.
 */

const { REQUEST_CODES, MESSAGES } = require('./moocfiResults')
const { sendSentryError } = require('./sentry')

// Bounds the sequential importer round trips one request can trigger.
const MAX_BATCH_SIZE = 1000

// Batch size for /attainments/import endpoint, smaller than the other endpoints that just fetch sisu data
const IMPORT_BATCH_SIZE = 100

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
 * importer calls as possible. Its throwing is a backstop, not a routine path: an endpoint
 * whose importer call fails should map that onto per-item serviceTemporarilyUnavailable.
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

    if (!Array.isArray(items)) return malformedRequest(res, 'Request body must be a JSON array of request items.')
    if (!items.length) return res.status(200).json([])
    if (items.length > maxBatchSize) {
      return malformedRequest(res, `A batch may contain at most ${maxBatchSize} request items.`)
    }

    const invalid = items.findIndex((item) => !item || typeof item.requestItemId !== 'string' || !item.requestItemId)
    if (invalid !== -1) return malformedRequest(res, `Request item at index ${invalid} has no string requestItemId.`)

    const ids = items.map(({ requestItemId }) => requestItemId)
    if (new Set(ids).size !== ids.length) return malformedRequest(res, 'Every requestItemId in a batch must be unique.')

    if (validateItem) {
      for (const item of items) {
        const message = validateItem(item)
        if (message) return malformedRequest(res, `Request item ${item.requestItemId}: ${message}`)
      }
    }

    try {
      return res.status(200).json(await handler(items))
    } catch (error) {
      sendSentryError('Batch request failed', error, { path: req.path })
      return requestError(res, 500, REQUEST_CODES.internalError, MESSAGES[REQUEST_CODES.internalError])
    }
  }

module.exports = { MAX_BATCH_SIZE, IMPORT_BATCH_SIZE, bodyErrorHandler, batchHandler }
