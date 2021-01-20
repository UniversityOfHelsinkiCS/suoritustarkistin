const api = require('../config/importerApi')
const logger = require('@utils/logger')

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
 * Grade should be passed as numerical representation, not for example grade local id
 */
const checkCompletions = async (courseCode, studentNumber, grade) => {
    try {
        const resp = await api.get(`suotar/attainments/${courseCode}/${studentNumber}`)
        const betterGrade = resp.data.some((attainment) => Number(attainment.gradeId) <= Number(grade))
        if (betterGrade) return true
        return false
    } catch(e) {
        logger.error({message: `Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`, sis: true, error: e.toString()})
        throw new Error(`Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`)
    }
}

module.exports = { checkCompletions }
