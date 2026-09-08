/**
 * Spec section 4: POST /api/attainments/verify. How courses.mooc.fi resolves a sisuTimeout
 * without risking a second submission.
 *
 * Read from Suotar's copy of Sisu, which lags the real thing by up to about an hour, so a
 * notRegistered means "no evidence yet", never "this will not happen".
 */

const _ = require('lodash')
const logger = require('@server/utils/logger')
const { getAttainmentStatuses } = require('@server/services/importer')
const { okItem, errorItem, batchHandler } = require('@server/utils/batchApi')
const { sendSentryError } = require('@server/utils/sentry')

const NOT_REGISTERED = 'No final or partial Sisu registration evidence was found for the submitted attainment id.'
const MISREGISTERED = 'A previously registered attainment has been marked misregistered in Sisu.'
const SISU_UNAVAILABLE = 'Sisu was temporarily unavailable during verification.'

const validateItem = ({ submittedAttainmentId }) =>
  typeof submittedAttainmentId === 'string' && submittedAttainmentId
    ? undefined
    : 'submittedAttainmentId must be a non-empty string.'

const verifyAttainments = batchHandler(async (items) => {
  const ids = _.uniq(items.map(({ submittedAttainmentId }) => submittedAttainmentId))

  let statusById
  try {
    const statuses = await getAttainmentStatuses(ids)
    statusById = new Map(statuses.map(({ id, attainment }) => [id, attainment]))
  } catch (error) {
    logger.error({ message: 'Verifying attainments failed', error: error.message, stack: error.stack })
    sendSentryError('Verifying attainments failed', error, { items: items.length })
    return items.map(({ requestItemId }) => errorItem(requestItemId, 'sisuTemporarilyUnavailable', SISU_UNAVAILABLE))
  }

  return items.map(({ requestItemId, submittedAttainmentId }) => {
    const attainment = statusById.get(submittedAttainmentId)
    if (!attainment) return errorItem(requestItemId, 'notRegistered', NOT_REGISTERED)
    if (attainment.misregistration) return errorItem(requestItemId, 'misregistered', MISREGISTERED)

    return okItem(requestItemId, 'registered', { attainment: { id: attainment.id, type: attainment.type } })
  })
}, validateItem)

module.exports = { verifyAttainments }
