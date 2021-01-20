const api = require('../config/importerApi')
const logger = require('@utils/logger')

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
 * Grade should be passed as full grade object from Sisu.
 */
const isImprovedGrade = async (courseCode, studentNumber, grade) => {
    try {
        const resp = await api.get(`suotar/attainments/${courseCode}/${studentNumber}`)
        const earlierCompletions = resp.data
        if (!earlierCompletions) return true
        
        if ([0,1,2,3,4,5].includes(Number(grade))) {
            const existingBetterGrade = earlierCompletions.some((attainment) => attainment.grade.numericCorrespondence >= Number(grade))
            if (existingBetterGrade) return false
        }
        if (['Hyl.', 'Hyv.'].includes(grade)) {
            const existingPassedCompletion = earlierCompletions.some((attainment) => attainment.grade.passed)
            if (existingPassedCompletion) return false
        }
        return true
    } catch(e) {
        logger.error({message: `Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`, sis: true, error: e.toString()})
        throw new Error(`Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`)
    }
}

module.exports = { isImprovedGrade }
