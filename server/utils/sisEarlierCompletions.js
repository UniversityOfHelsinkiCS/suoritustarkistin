const api = require('../config/importerApi')
const logger = require('@utils/logger')

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
**/
const isImprovedGrade = (allEarlierAttainments, studentNumber, grade) => {
  if (!allEarlierAttainments) return true
  
  const earlierAttainments = allEarlierAttainments.find((a) => a.studentNumber === studentNumber).attainments
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

const fetchEarlierAttainments = async (createdEntries, courses) => {
  try {
    const data = createdEntries.map((rawEntry) => {
      const course = courses.find((c) => c.id === rawEntry.courseId)
      return ({ courseCode: course.courseCode, studentNumber: rawEntry.studentNumber })
    })  
    const res = await api.post(`suotar/attainments`, data)
    return res.data
  } catch (e) {
    if (e.response.data.status === 404) throw new Error(e.response.data.message)
    throw new Error(e.toString())
  }
}

const isImprovedTier = async (courseCode, studentNumber, credits) => {
  try {
    const resp = await api.get(`suotar/attainments/${courseCode}/${studentNumber}`)
    const earlierCompletions = resp.data
    if (!earlierCompletions) return true

    const existingHigherTier = earlierCompletions.some((attainment) => attainment.credits >= Number(credits))
    if (existingHigherTier) return false

    return true
  } catch(e) {
    logger.error({message: `Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`, sis: true, error: e.toString()})
    throw new Error(`Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`)
  }
}


module.exports = { isImprovedGrade, isImprovedTier, fetchEarlierAttainments }