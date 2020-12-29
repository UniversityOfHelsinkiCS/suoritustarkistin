
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')
const { api } = require('../config/importerApi')


/**
 * Mankel raw entries to sis entries.
 *
 * Some extra mayhem with grader and course relations as createdEntries contains only
 * raw entries and related foreign keys. We can't query raw entries with include as we
 * are inside a transaction and relations needs to be fetched separately.
 */
const processEntries = async (createdEntries, senderId, transaction) => {
    const graderIds = new Set(createdEntries.map((rawEntry) => rawEntry.graderId))
    const graders = await db.users.findAll({
        where: {
            id: {[Op.in]: Array.from(graderIds)}
        }
    })

    const studentNumbers = createdEntries.map((rawEntry) => rawEntry.studentNumber)
    const students = await api.post('students/', studentNumbers)
    const employeeIds = graders.map((grader) => grader.employeeId)
    const employees = await getEmployees(employeeIds)
    const courseRealisations = await getCourseUnitRealisations(createdEntries)
    const courseUnits = await getCourseUnits(createdEntries)

    // TODO: Map grade to grade scale
    const data = createdEntries.map((rawEntry) => {
        const student = students.data.find(({studentNumber}) => studentNumber === rawEntry.studentNumber)
        const grader = graders.find((g) => g.id === rawEntry.graderId)
        const verifier = employees.find(({employeeNumber}) => employeeNumber === grader.employeeId)
        const courseUnitRealisation = courseRealisations[rawEntry.id]
        const courseUnit = courseUnits[rawEntry.id]
        if (!student) throw new Error(`Person with student number ${rawEntry.studentNumber} not found from Sisu`)
        if (!verifier) throw new Error(`Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`)
        if (!courseUnitRealisation) throw new Error(`No active or past course unit realisation found with course code ${rawEntry.course.courseCode}`)

        return {
            personId: student.id,
            verifierPersonId: verifier.id,
            completionDate: rawEntry.attainmentDate,
            completionLanguage: rawEntry.language,
            hasSent: false,
            rawEntryId: rawEntry.id,
            senderId,
            gradeId: '5',
            ...courseUnitRealisation,
            ...courseUnit
        }
    })

    await db.entries.bulkCreate(data, {transaction})
    return true
}

// TODO: Create endpoint to db.api for batch converting employee ids
async function getEmployees(employeeIds) {
    const responses = await Promise.all(employeeIds.map(async (employeeId) =>
        await api.get(`employees/${employeeId}`)
    ))
    return _.flatten(responses.map((resp) => resp.data))
}

/**
 * Resolve an active object based on given date. Objects needs to have activity
 * property with startDate and endDate. By default the property is activityPeriod, but
 * it can be changed with key argument.
 */
function resolveActiveObject(objects, date, key = 'activityPeriod') {
    const momentDate = moment(date)
    const active = objects.find((obj) => {
        const { startDate, endDate } = obj[key]
        return momentDate.isBetween(moment(startDate), moment(endDate))
    })
    if (active) return active

    const sorted = objects
        .filter((obj) => moment(obj[key].endDate).isBefore(momentDate))
        .sort((a, b) => moment(b[key].endDate).diff(moment(a[key].endDate)))

    return sorted[0]
}

/**
 * Map correct course unit realisation id and assessment item id by raw entry id.
 */
async function getCourseUnitRealisations(rawEntries) {
    const courses = await getCourses(rawEntries)
    const courseUnitRealisations = {}
    for (const course of courses) {
        const { courseCode } = course
        courseUnitRealisations[courseCode] = await fetchCourseUnitRealisation(courseCode)
    }

    const courseRealisations = {}
    for (const rawEntry of rawEntries) {
        const {courseId, attainmentDate, id} = rawEntry
        const {courseCode} = courses.find((c) => c.id === courseId)
        const {assessmentItemIds, id: courseUnitRealisationId} = resolveActiveObject(courseUnitRealisations[courseCode], attainmentDate)
        courseRealisations[id] = {
            courseUnitRealisationId: courseUnitRealisationId,
            assessmentItemId: assessmentItemIds[0]
        }
    }
    return courseRealisations
}

async function getCourseUnits(rawEntries) {
    const courses = await getCourses(rawEntries)
    const courseUnitData = {}
    for (const course of courses) {
        const { courseCode } = course
        courseUnitData[courseCode] = await fetchCourseUnit(courseCode)
    }

    const courseUnits = {}
    for (const rawEntry of rawEntries) {
        const {courseId, attainmentDate, id} = rawEntry
        const {courseCode} = courses.find((c) => c.id === courseId)
        const {id: courseUnitId, gradeScaleId} = resolveActiveObject(courseUnitData[courseCode], attainmentDate, 'validityPeriod')
        courseUnits[id] = { courseUnitId, gradeScaleId }
    }
    return courseUnits
}

/**
 * Get active course unit realisation by course code and date.
 * If no active found, return closest already ended realisation.
 */
async function fetchCourseUnitRealisation(courseCode) {
    try {
        const resp = await api.get(`course_unit_realisations/?code=${courseCode}`)
        return resp.data
    } catch (e) {
        if (e.response.data.status === 404) throw new Error(e.response.data.message)
        throw new Error(e.toString())
    }
}

/**
 * Get active course unit object by course code and date.
 * If no active found, return closest already ended course unit.
 */
async function fetchCourseUnit(courseCode) {
    try {
        const resp = await api.get(`course_units/?codes=${courseCode}`)
        return resp.data
    } catch (e) {
        if (e.response.data.status === 404) throw new Error(e.response.data.message)
        throw new Error(e.toString())
    }
}

/**
 * Get all course instances related to raw entries
 */
async function getCourses(rawEntries) {
    const courseIds = new Set(rawEntries.map(({courseId}) => courseId))
    return await db.courses.findAll({
        where: {
            id: {[Op.in]: Array.from(courseIds)}
        }
    })
}

module.exports = {
    processEntries
}
