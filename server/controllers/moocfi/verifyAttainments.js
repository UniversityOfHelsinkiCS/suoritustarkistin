/**
 * Spec section 4: POST /api/attainments/verify. How courses.mooc.fi resolves a sisuTimeout
 * without risking a second submission.
 *
 * Read from Suotar's copy of Sisu, which lags the real thing by up to about an hour, so an
 * attainment Suotar has just submitted is invisible here for a while. A submitted id the
 * importer does not hold yet is answered submissionPending rather than notRegistered.
 */

const _ = require('lodash')

const db = require('@server/models/index')
const { getAttainmentStatuses } = require('@server/services/importer')
const { batchHandler } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem, serviceUnavailable } = require('@server/utils/moocfiResults')
const { sendSentryError } = require('@server/utils/sentry')
const { ASSESSMENT_ITEM_ATTAINMENT_TYPE } = require('@server/utils/sisuAttainmentRules')

// The importer syncs with Sisu hourly, so this is far longer than the delay it covers. It is
// the window in which resubmitting risks a duplicate, and a day of waiting costs less than one.
const PENDING_WINDOW_MS = 24 * 60 * 60 * 1000

const UNSETTLED_SEND_STATES = ['ATTEMPTED', 'ACCEPTED']

const validateItem = ({ submittedAttainmentId }) =>
  typeof submittedAttainmentId === 'string' && submittedAttainmentId
    ? undefined
    : 'submittedAttainmentId must be a non-empty string.'

const isOverdue = (entry) => entry.createdAt.getTime() < Date.now() - PENDING_WINDOW_MS

/**
 * The entries whose attainment the importer may simply not have handed over yet.
 *
 * ATTEMPTED leaves the set once the window passes: that send was never confirmed, so by then
 * "it never landed" is the likelier reading and mooc.fi should be free to submit again.
 * ACCEPTED never leaves it. Sisu answered the POST that wrote that state, so the attainment
 * exists, and notRegistered would read as permission to submit a second one.
 */
const findPendingSubmissions = async (ids) => {
  if (!ids.length) return new Map()

  const entries = await db.entries.findAll({
    where: { id: ids, sendState: UNSETTLED_SEND_STATES },
    attributes: ['id', 'createdAt', 'sendState']
  })
  const pending = entries.filter((entry) => entry.sendState === 'ACCEPTED' || !isOverdue(entry))

  return new Map(pending.map((entry) => [entry.id, entry]))
}

/**
 * An ACCEPTED attainment that cannot be found in sisu data even after the pending time is
 * reported as a sentry error. It should never happen unless something is wrong with importer
 */
const reportStuckSubmissions = (entries, log) => {
  const ids = entries.map(({ id }) => id)
  const oldest = entries.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt.toISOString()

  log.error(`${ids.length} accepted attainments are still missing from the importer`, { ids, oldest })
  sendSentryError('Accepted attainments are missing from the importer', null, {
    attainmentIds: ids.slice(0, 20),
    amount: ids.length,
    oldest
  })
}

const retryAfter = (entry) => {
  const scheduled = entry.createdAt.getTime() + PENDING_WINDOW_MS
  // Only an ACCEPTED entry stays pending past its own window, and a retryAfter in the past
  // would read as permission to submit a second attainment. Keep it a window ahead instead.
  return new Date(scheduled > Date.now() ? scheduled : Date.now() + PENDING_WINDOW_MS)
}

const submissionPending = (requestItemId, entry) =>
  errorItem(requestItemId, CODES.submissionPending, {
    result: {
      submittedAttainmentId: entry.id,
      submittedAttainmentType: ASSESSMENT_ITEM_ATTAINMENT_TYPE,
      retryAfter: retryAfter(entry).toISOString()
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

  const stuck = [...pending.values()].filter(isOverdue)
  if (stuck.length) reportStuckSubmissions(stuck, log)

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
