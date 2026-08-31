/**
 * The envelope shared by every courses.mooc.fi batch endpoint: one response item per
 * request item, in request order. Per-item outcomes are always HTTP 200; only a
 * request-level failure is a 4xx.
 */

const logger = require('@server/utils/logger')
const { sendSentryError } = require('./sentry')

// Bounds the sequential importer round trips one request can trigger.
const MAX_BATCH_SIZE = 1000

const okItem = (requestItemId, code, result) => ({ requestItemId, status: 'ok', code, result })

const errorItem = (requestItemId, code, message) => ({
  requestItemId,
  status: 'error',
  code,
  error: { message }
})

const malformedRequest = (res, message) => res.status(400).json({ error: { code: 'malformedRequest', message } })

/**
 * `handler` takes the whole batch at once so it can collapse the items into as few
 * importer calls as possible. Its throwing is a backstop, not a routine path: an endpoint
 * whose importer call fails should map that onto per-item sisuTemporarilyUnavailable.
 */
const batchHandler = (handler) => async (req, res) => {
  const items = req.body

  if (!Array.isArray(items)) return malformedRequest(res, 'Request body must be a JSON array of request items.')
  if (!items.length) return res.status(200).json([])
  if (items.length > MAX_BATCH_SIZE)
    return malformedRequest(res, `A batch may contain at most ${MAX_BATCH_SIZE} request items.`)

  const invalid = items.findIndex((item) => !item || typeof item.requestItemId !== 'string' || !item.requestItemId)
  if (invalid !== -1) return malformedRequest(res, `Request item at index ${invalid} has no string requestItemId.`)

  const ids = items.map(({ requestItemId }) => requestItemId)
  if (new Set(ids).size !== ids.length) return malformedRequest(res, 'Every requestItemId in a batch must be unique.')

  try {
    return res.status(200).json(await handler(items))
  } catch (error) {
    logger.error({ message: 'Batch request failed', path: req.path, error: error.message, stack: error.stack })
    sendSentryError('Batch request failed', error, { path: req.path })
    return res.status(500).json({ error: { code: 'internalError', message: 'Suotar failed to process the request.' } })
  }
}

module.exports = { MAX_BATCH_SIZE, okItem, errorItem, batchHandler }
