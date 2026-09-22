/**
 * Which course codes the courses.mooc.fi API will register, and why it refuses the rest.
 *
 * Shared by section 3 and the course code check so the two cannot drift: a code the check
 * calls valid has to be one the import accepts.
 */

const {
  ALL_EOAI_CODES,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE
} = require('@shared/common')

// TEMPORARY. Elements of AI and Building AI have their own registration paths in the automated
// jobs, and how they should behave through this API is not settled.
const UNSETTLED_COURSE_CODES = new Set([
  ...ALL_EOAI_CODES,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE
])

/**
 * The message courseNotAllowed carries, or undefined when the code may be registered.
 * `course` is Suotar's own course row, undefined when it does not carry the code.
 */
const courseNotAllowedReason = (courseCode, course) => {
  if (UNSETTLED_COURSE_CODES.has(courseCode)) return `${courseCode} cannot be registered through this API yet.`
  if (!course) return 'Suotar does not carry this course code.'
  return undefined
}

module.exports = { courseNotAllowedReason }
