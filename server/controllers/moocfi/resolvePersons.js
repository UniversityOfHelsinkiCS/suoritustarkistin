/**
 * Spec section 1: POST /api/persons/resolve-by-student-numbers.
 *
 * One importer call for the whole batch, then each item is matched back by student number.
 */

const _ = require('lodash')
const logger = require('@server/utils/logger')
const { getStudents } = require('@server/services/importer')
const { okItem, errorItem, batchHandler } = require('@server/utils/batchApi')
const { sendSentryError } = require('@server/utils/sentry')

const SISU_UNAVAILABLE = 'Sisu was temporarily unavailable.'

const validateItem = ({ studentNumber }) =>
  typeof studentNumber === 'string' && studentNumber ? undefined : 'studentNumber must be a non-empty string.'

// The importer returns whole Person rows; only the fields the spec names are passed on.
const toResult = ({ id, studentNumber, firstNames, lastName }) => ({
  studentNumber,
  personId: id,
  firstNames,
  lastName
})

const fetchPersonsByStudentNumber = async (studentNumbers) => {
  const persons = await getStudents(studentNumbers)
  if (!Array.isArray(persons)) throw new Error(`Importer returned ${typeof persons} instead of an array of persons`)
  return new Map(persons.map((person) => [person.studentNumber, person]))
}

const resolvePersons = batchHandler(async (items) => {
  let personsByStudentNumber
  try {
    personsByStudentNumber = await fetchPersonsByStudentNumber(_.uniq(items.map((item) => item.studentNumber)))
  } catch (error) {
    // The importer is the only thing that can fail here, so one failure fails every item.
    // Deliberately not rethrown: a request-level 500 would tell mooc.fi to retry the batch,
    // which is what the per-item code already says, and it would lose the requestItemIds.
    logger.error({ message: 'Resolving persons failed', error: error.message, stack: error.stack })
    sendSentryError('Resolving persons failed', error, { items: items.length })
    return items.map(({ requestItemId }) => errorItem(requestItemId, 'sisuTemporarilyUnavailable', SISU_UNAVAILABLE))
  }

  return items.map(({ requestItemId, studentNumber }) => {
    const person = personsByStudentNumber.get(studentNumber)
    return person
      ? okItem(requestItemId, 'personFound', toResult(person))
      : errorItem(requestItemId, 'personNotFound', 'No Sisu person was found for the supplied student number.')
  })
}, validateItem)

module.exports = { resolvePersons }
