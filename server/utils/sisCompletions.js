const api = require('../config/importerApi')
const logger = require('@utils/logger')

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
 * Grade should be passed as full grade object from Sisu.
 */
const checkCompletions = async (courseCode, studentNumber, grade) => {
    try {
        const resp = await api.get(`suotar/attainments/${courseCode}/${studentNumber}`)
        if (!resp.data.length) return true
        // If numeric correspondence is not null, the grade scale is numeric
        if (grade.numericCorrespondence !== null)
            return resp.data.some((attainment) => attainment.grade.numericCorrespondence <= grade.numericCorrespondence)

        // Otherwise the grade scale is hyv./hyl. and comparison is done by passed attribute
        if (grade.passed) return true
        return resp.data.every((attainment) => !attainment.grade.passed)
    } catch(e) {
        logger.error({message: `Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`, sis: true, error: e.toString()})
        throw new Error(`Failed to retrieve attainments for course ${courseCode} and student ${studentNumber}`)
    }
}

module.exports = { checkCompletions }
