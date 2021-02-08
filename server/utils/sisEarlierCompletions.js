const api = require('../config/importerApi')
const _ = require('lodash')

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
**/
const isImprovedGrade = (allEarlierAttainments, studentNumber, grade) => {
  if (!allEarlierAttainments) return true
  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAttainments = student ? student.attainments : undefined
  if (!earlierAttainments) return true

  if ([0,1,2,3,4,5].includes(Number(grade))) {
    const existingBetterGrade = earlierAttainments.some((attainment) => attainment.grade.numericCorrespondence >= Number(grade))
    if (existingBetterGrade) return false
  }

  if (['Hyl.', 'Hyv.'].includes(grade)) {
    const existingPassedAttainment = earlierAttainments.some((attainment) => attainment.grade.passed)
    if (existingPassedAttainment) return false
  }

  return true
}

/**
 * Returns a list of objects { studentNumber, courseCode, earlierAttainments }.
 * The data must be fetched in chunks of 100, since importer-api cannot handle bigger payloads. 
 */
const fetchEarlierAttainments = async (data) => {
  let allData = []
  try {
    const chunks = _.chunk(data, 150)
    for (const chunk of chunks) {
      const res = await api.post(`suotar/attainments`, chunk)
      allData = _.concat(allData, res.data)
    }
    return allData
  } catch (e) {
    if (e.response.data.status === 404) throw new Error(e.response.data.message)
    throw new Error(e.toString())
  }
}

const isImprovedTier = async (allEarlierAttainments, studentNumber, credits) => {
  if (!allEarlierAttainments) return true

  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAttainments = student ? student.attainments : undefined
  if (!earlierAttainments) return true

  const existingHigherTier = earlierAttainments.some((attainment) => attainment.credits >= Number(credits))
  if (existingHigherTier) return false

  return true
}


module.exports = { isImprovedGrade, isImprovedTier, fetchEarlierAttainments }