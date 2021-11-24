const moment = require('moment')

const MATLU_CODE = 'H50'

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

module.exports = resolveStudyRight
