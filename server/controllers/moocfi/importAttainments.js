/**
 * Spec section 3: POST /api/attainments/import.
 *
 * processMoocfiImport resolves and stores; this sends what survived to Sisu and turns the
 * outcome into one result per request item.
 */

const logger = require('@server/utils/logger')
const db = require('@server/models/index')
const attainmentsToSisu = require('@server/utils/sendToSisu')
const { processMoocfiImport } = require('@server/scripts/processMoocfiImport')
const { batchHandler, IMPORT_BATCH_SIZE } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem } = require('@server/utils/moocfiResults')
const { ASSESSMENT_ITEM_ATTAINMENT_TYPE } = require('@server/utils/sisuAttainmentRules')

// No person is sending these; the name only exists so the send is identifiable in the logs.
const SENDER = { uid: 'moocfi-api', name: 'courses.mooc.fi' }

// Faster timeout for Sisu send than the internal systems
const SEND_TIMEOUT_MS = 30_000

const isBlank = (value) => typeof value !== 'string' || !value

const validateItem = (item) => {
  const strings = ['studentNumber', 'courseCode', 'enrolmentId', 'attainmentDate', 'attainmentLanguage', 'gradeId']
  for (const field of strings) {
    if (isBlank(item[field])) return `${field} must be a non-empty string.`
  }
  if (!Number.isFinite(item.credits)) return 'credits must be a number.'
  if (Number.isNaN(Date.parse(item.attainmentDate))) return 'attainmentDate must be a date.'
  return undefined
}

// Sisu reports a rejection as violations per attainment; entries.errors holds whatever it sent.
// TODO: revisit the whole error handling of this endpoint, make sure every possible case returns
// the expected errors and that we have the correct expectations about error shapes returned by Sisu
const describeViolations = (errors) => {
  const violations = Array.isArray(errors) ? errors : Object.values(errors || {}).flat()
  const described = violations.filter((v) => typeof v === 'string').join('; ')
  return described ? `Sisu rejected the attainment: ${described}` : 'Sisu rejected the attainment.'
}

/**
 * The entry's own state says how the send went, not attainmentsToSisu's return value: that
 * answers 400 for the batch even when its retry got the rest of the attainments through.
 *
 * Anything not settled is answered as a timeout, with the id, which is what section 4 needs to
 * find out what became of it.
 */
const outcomeFor = (requestItemId, entryId, row) => {
  if (row?.sendState === 'REJECTED') {
    return errorItem(requestItemId, CODES.sisuValidationFailed, { message: describeViolations(row.errors) })
  }

  const result = { submittedAttainmentId: entryId, submittedAttainmentType: ASSESSMENT_ITEM_ATTAINMENT_TYPE }
  if (row?.sendState === 'ACCEPTED') return okItem(requestItemId, CODES.sent, result)
  return errorItem(requestItemId, CODES.sisuTimeout, { result })
}

const importAttainments = batchHandler(
  async (items) => {
    const { results, send } = await processMoocfiImport(items)

    if (send.entries.length) {
      const entryIds = send.entries.map(({ entry }) => entry.id)
      // The acceptors come with the entries rather than being looked up here, so that the send
      // has nothing left to fail at but the send itself.
      const [status, body] = await attainmentsToSisu('entries', {
        user: SENDER,
        body: { entryIds },
        acceptors: send.acceptors,
        timeout: SEND_TIMEOUT_MS
      })
      logger.info({ message: 'Sent a courses.mooc.fi import to Sisu', amount: entryIds.length, status, body })

      const rows = await db.entries.findAll({ where: { id: entryIds }, attributes: ['id', 'sendState', 'errors'] })
      const rowById = new Map(rows.map((row) => [row.id, row]))
      for (const { requestItemId, entry } of send.entries) {
        results.push(outcomeFor(requestItemId, entry.id, rowById.get(entry.id)))
      }
    }

    const order = new Map(items.map(({ requestItemId }, index) => [requestItemId, index]))
    return results.sort((a, b) => order.get(a.requestItemId) - order.get(b.requestItemId))
  },
  validateItem,
  IMPORT_BATCH_SIZE
)

module.exports = { importAttainments }
