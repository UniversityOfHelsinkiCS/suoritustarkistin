const moment = require('moment')
const { flatten } = require('lodash')

const MATLU_CODE = 'H50'
const term_startdate = '08-01'

const resolveTerm = (attainmentDate) => {
  const date = new Date(attainmentDate)
  const year = date.getFullYear()
  const attainmentTermIndex = moment(date).isBefore(moment(`${year}-${term_startdate}`)) ? 1 : 0

  return {
    attainmentStartYear: attainmentTermIndex === 1 ? year - 1 : year,
    attainmentTermIndex
  }
}

/**
 * Filter study right which is within given attainment date.
 * Filter study right where the student has registered ATTENDING or is avoin studyright (these do not include term registrations)
 * Take primarily Matlu studyright, if none active exists, take any studyright
 * If doing kandikirjaus, qualify on Matlu studyrights
 * If none found return empty object.
 */
const resolveStudyRight = (studyRights, attainmentDate, onlyMatlu) => {
  const attDate = moment(attainmentDate)
  const { attainmentStartYear, attainmentTermIndex } = resolveTerm(attDate)

  const filterByAttainmentDate = ({ valid }) =>
    moment(valid.startDate).isSameOrBefore(attDate) && moment(valid.endDate).isAfter(attDate)

  const filterByTermRegistration = ({ term_registrations, id }) => {
    if (id.includes('avoin')) return true
    const registrations = term_registrations?.termRegistrations
    if (!registrations) return false

    return registrations.some((registration) => {
      if (!registration || !registration.studyTerm) return false
      const { studyTerm, termRegistrationType } = registration
      const { studyYearStartYear, termIndex } = studyTerm
      if (
        termRegistrationType === 'ATTENDING' &&
        studyYearStartYear === attainmentStartYear &&
        termIndex === attainmentTermIndex
      )
        return true
    })
  }

  const filtered = studyRights.filter(filterByAttainmentDate).filter(filterByTermRegistration)

  const matluRights = filtered.filter(({ organisation }) => organisation.code === MATLU_CODE)

  if (onlyMatlu) {
    return matluRights[0] || {}
  }

  if (!matluRights.length) {
    return filtered[0] || {}
  }

  return matluRights[0] || {}
}

/**
 * Figure out closest study right for given date. If the date is not within any study right
 * correct also the date to be valid.
 *
 * Returns array with [id, correctedAttainmentDate]
 */
const getClosestStudyRight = (studyRights, attainmentDate) => {
  const attDate = moment(attainmentDate)

  const dates =
    flatten(
      studyRights.map(({ valid, id }) => [
        { date: moment(valid.startDate), id },
        { date: moment(valid.endDate), id }
      ])
    ).sort((a, b) => Math.abs(attDate.diff(a.date)) - Math.abs(attDate.diff(b.date)))[0] || {}
  const { id } = dates

  if (!id) return []

  const { valid } = studyRights.find((s) => s.id === id)

  const studyRightStart = moment(valid.startDate)
  const studyRightEnd = moment(valid.endDate)
  if (attDate.isBetween(studyRightStart, studyRightEnd)) return [id, attDate]

  let newAttainmentDate
  if (attDate.isBefore(studyRightStart)) newAttainmentDate = studyRightStart
  else if (attDate.isSameOrAfter(studyRightEnd)) newAttainmentDate = studyRightEnd.subtract(1, 'day')
  return [id, newAttainmentDate]
}

module.exports = { resolveStudyRight, getClosestStudyRight }
