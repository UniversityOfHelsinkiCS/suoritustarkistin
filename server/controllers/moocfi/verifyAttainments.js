/**
 * Spec section 4: POST /api/attainments/verify. How courses.mooc.fi resolves a sisuTimeout
 * without risking a second submission.
 *
 * Read from Suotar's copy of Sisu, which lags the real thing by up to about an hour, so a
 * notRegistered means "no evidence yet", never "this will not happen".
 */

const _ = require('lodash')
const { getAttainmentStatuses } = require('@server/services/importer')
const { batchHandler } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem, serviceUnavailableForAll } = require('@server/utils/moocfiResults')

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
    return serviceUnavailableForAll(items, 'Verifying attainments failed', error)
  }

  return items.map(({ requestItemId, submittedAttainmentId }) => {
    const attainment = statusById.get(submittedAttainmentId)
    if (!attainment) return errorItem(requestItemId, CODES.notRegistered)
    if (attainment.misregistration) return errorItem(requestItemId, CODES.misregistered)

    return okItem(requestItemId, CODES.registered, { attainment: { id: attainment.id, type: attainment.type } })
  })
}, validateItem)

module.exports = { verifyAttainments }
