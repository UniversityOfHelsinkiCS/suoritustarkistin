const moment = require('moment')
const { flatten } = require('lodash')

const MATLU_CODE = 'H50'

/**
 * Resolve study right which is within given attainment date.
 * If none found return empty object.
 */
const resolveStudyRight = (studyRights, attainmentDate, onlyMatlu) => {
  const attDate = moment(attainmentDate)
  const filterByAttainmentDate = ({ valid }) => (
    moment(valid.startDate).isSameOrBefore(attDate) &&
    moment(valid.endDate).isAfter(attDate)
  )

  let filtered = studyRights
    .filter(({ organisation }) => organisation.code === MATLU_CODE)

  if (onlyMatlu)
    return filtered.filter(filterByAttainmentDate)[0] || {}

  if (!filtered.length)
    filtered = studyRights

  return filtered.filter(filterByAttainmentDate)[0] || {}
}

/**
 * Figure out closest study right for given date. If the date is not within any study right
 * correct also the date to be valid.
 *
 * Returns array with [id, correctedAttainmentDate]
 */
const getClosestStudyRight = (studyRights, attainmentDate) => {
  const attDate = moment(attainmentDate)
  const dates = flatten(
    studyRights.map(({ valid, id }) => [{ date: moment(valid.startDate), id }, { date: moment(valid.endDate), id }])
  )
    .sort((a, b) => Math.abs(attDate.diff(a.date)) - Math.abs(attDate.diff(b.date)))[0] || {}
  const { id } = dates

  if (!id) return []

  const { valid } = studyRights.find((s) => s.id === id)

  const studyRightStart = moment(valid.startDate)
  const studyRightEnd = moment(valid.endDate)
  if (attDate.isBetween(studyRightStart, studyRightEnd))
    return [id, attDate]

  let newAttainmentDate
  if (attDate.isBefore(studyRightStart))
    newAttainmentDate = studyRightStart
  else if (attDate.isSameOrAfter(studyRightEnd))
    newAttainmentDate = studyRightEnd.subtract(1, 'day')
  return [id, newAttainmentDate]
}

module.exports = { resolveStudyRight, getClosestStudyRight }
