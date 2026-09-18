/**
 * Spec section 4: POST /api/attainments/verify. How courses.mooc.fi resolves a sisuTimeout
 * without risking a second submission.
 *
 * Read from Suotar's copy of Sisu, which lags the real thing by up to about an hour, so an
 * attainment Suotar has just submitted is invisible here for a while. A recently submitted
 * (<2h ago) id is answered submissionPending if it's not found from importer yet.
 */

const _ = require('lodash')
const { Op } = require('sequelize')

const db = require('@server/models/index')
const { getAttainmentStatuses } = require('@server/services/importer')
const { batchHandler } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem, serviceUnavailable } = require('@server/utils/moocfiResults')
const { ASSESSMENT_ITEM_ATTAINMENT_TYPE } = require('@server/utils/sisuAttainmentRules')

// 2 hour pending time, importer syncs with Sisu data hourly
const PENDING_WINDOW_MS = 2 * 60 * 60 * 1000

const UNSETTLED_SEND_STATES = ['ATTEMPTED', 'ACCEPTED']

const validateItem = ({ submittedAttainmentId }) =>
  typeof submittedAttainmentId === 'string' && submittedAttainmentId
    ? undefined
    : 'submittedAttainmentId must be a non-empty string.'

const findPendingSubmissions = async (ids) => {
  if (!ids.length) return new Map()

  const entries = await db.entries.findAll({
    where: {
      id: ids,
      sendState: UNSETTLED_SEND_STATES,
      createdAt: { [Op.gt]: new Date(Date.now() - PENDING_WINDOW_MS) }
    },
    attributes: ['id', 'createdAt']
  })

  return new Map(entries.map((entry) => [entry.id, entry]))
}

const submissionPending = (requestItemId, entry) =>
  errorItem(requestItemId, CODES.submissionPending, {
    result: {
      submittedAttainmentId: entry.id,
      submittedAttainmentType: ASSESSMENT_ITEM_ATTAINMENT_TYPE,
      retryAfter: new Date(entry.createdAt.getTime() + PENDING_WINDOW_MS).toISOString()
    }
  })

const verifyAttainments = batchHandler(async (items, log) => {
  const ids = _.uniq(items.map(({ submittedAttainmentId }) => submittedAttainmentId))

  let statusById
  try {
    const statuses = await getAttainmentStatuses(ids)
    statusById = new Map(statuses.map(({ id, attainment }) => [id, attainment]))
  } catch (error) {
    throw serviceUnavailable('Verifying attainments failed', error, { items: items.length })
  }

  const missing = ids.filter((id) => !statusById.get(id))
  const pending = await findPendingSubmissions(missing)

  const notRegistered = missing.length - pending.size
  const line = { ids: ids.length, found: ids.length - missing.length, pending: pending.size, notRegistered }
  if (notRegistered) log.warn(`${notRegistered} submitted attainments are not registered`, line)
  else log.info('Verified the batch against the importer', line)

  return items.map(({ requestItemId, submittedAttainmentId }) => {
    const attainment = statusById.get(submittedAttainmentId)
    if (attainment?.misregistration) return errorItem(requestItemId, CODES.misregistered)
    if (attainment) {
      return okItem(requestItemId, CODES.registered, { attainment: { id: attainment.id, type: attainment.type } })
    }

    const entry = pending.get(submittedAttainmentId)
    return entry ? submissionPending(requestItemId, entry) : errorItem(requestItemId, CODES.notRegistered)
  })
}, validateItem)

module.exports = { verifyAttainments }
