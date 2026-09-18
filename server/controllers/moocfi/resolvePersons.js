/**
 * Spec section 1: POST /api/persons/resolve-by-student-numbers.
 *
 * One importer call for the whole batch, then each item is matched back by student number.
 */

const _ = require('lodash')
const { getStudents } = require('@server/services/importer')
const { batchHandler } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem, serviceUnavailable, requireImporterArray } = require('@server/utils/moocfiResults')

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
  const persons = requireImporterArray(await getStudents(studentNumbers), 'persons')
  return new Map(persons.map((person) => [person.studentNumber, person]))
}

const resolvePersons = batchHandler(async (items) => {
  let personsByStudentNumber
  try {
    personsByStudentNumber = await fetchPersonsByStudentNumber(_.uniq(items.map((item) => item.studentNumber)))
  } catch (error) {
    throw serviceUnavailable('Resolving persons failed', error, { items: items.length })
  }

  return items.map(({ requestItemId, studentNumber }) => {
    const person = personsByStudentNumber.get(studentNumber)
    return person
      ? okItem(requestItemId, CODES.personFound, toResult(person))
      : errorItem(requestItemId, CODES.personNotFound)
  })
}, validateItem)

module.exports = { resolvePersons }
