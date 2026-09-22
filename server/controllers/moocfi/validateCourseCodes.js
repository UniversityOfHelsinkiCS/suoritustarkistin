/**
 * Spec section 7: POST /api/course-codes/validate.
 *
 * Whether a course code can be registered through section 3 at all. Suotar's course list is
 * maintained by hand, so a course Sisu knows perfectly well still has to be added before its
 * first completion is submitted; this answers that without submitting one.
 *
 * Reads nothing but Suotar's own courses table, so it is a single query for the whole batch
 * and says nothing about the rest of an import: a code that passes here can still fail on the
 * enrolment, the credits or the grade.
 */

const db = require('@server/models/index')
const { batchHandler } = require('@server/utils/batchApi')
const { courseNotAllowedReason } = require('@server/utils/moocfiCourses')
const { CODES, okItem, errorItem } = require('@server/utils/moocfiResults')

const validateItem = ({ courseCode }) =>
  typeof courseCode === 'string' && courseCode ? undefined : 'courseCode must be a non-empty string.'

const validateCourseCodes = batchHandler(async (items) => {
  const courses = await db.courses.findAll({
    where: { courseCode: [...new Set(items.map(({ courseCode }) => courseCode))] },
    attributes: ['courseCode', 'name']
  })
  const coursesByCode = new Map(courses.map((course) => [course.courseCode, course]))

  return items.map(({ requestItemId, courseCode }) => {
    const course = coursesByCode.get(courseCode)
    const notAllowed = courseNotAllowedReason(courseCode, course)

    return notAllowed
      ? errorItem(requestItemId, CODES.courseNotAllowed, { message: notAllowed })
      : okItem(requestItemId, CODES.courseAllowed, { courseCode, name: course.name })
  })
}, validateItem)

module.exports = { validateCourseCodes }
