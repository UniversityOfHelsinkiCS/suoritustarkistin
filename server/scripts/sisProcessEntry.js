const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')
const api = require('../config/importerApi')
const qs = require('querystring')
const logger = require('@utils/logger')
const { isImprovedGrade } = require('@utils/sisEarlierCompletions')

/**
 * Mankel raw entries to sis entries.
 *
 * Some extra mayhem with grader and course relations as createdEntries contains only
 * raw entries and related foreign keys. We can't query raw entries with include as we
 * are inside a transaction and relations needs to be fetched separately.
 */
const processEntries = async (createdEntries, transaction, sourceOfData) => {
    const graderIds = new Set(createdEntries.map((rawEntry) => rawEntry.graderId))
    const graders = await db.users.findAll({
        where: {
            id: { [Op.in]: Array.from(graderIds) }
        }
    })

    const studentNumbers = createdEntries.map((rawEntry) => rawEntry.studentNumber)
    const students = await api.post('students/', studentNumbers)
    if (!students.data) throw new Error('Persons with some of the student numbers not found from Sisu')

    const employeeIds = graders.map((grader) => grader.employeeId)
    const employees = await getEmployees(employeeIds)
    if (!employees) throw new Error('Persons with any of the employee numbers not found from Sisu')

    const courseRealisations = await getCourseUnitRealisations(createdEntries)
    if (!courseRealisations) throw new Error('No active or past course unit realisation found with the course code')

    const courseUnits = await getCourseUnits(createdEntries)
    if (!courseUnits) throw new Error('Course with the course code not found from Sisu')

    const courses = await getCourses(createdEntries)
    const gradeScaleIds = Object.keys(courseUnits).map((key) => courseUnits[key].gradeScaleId)
    const gradeScales = await getGrades(gradeScaleIds)

    const data = await Promise.all(createdEntries.map(async (rawEntry) => {
        const student = students.data.find(({ studentNumber }) => studentNumber === rawEntry.studentNumber)
        const grader = graders.find((g) => g.id === rawEntry.graderId)
        const verifier = employees.find(({ employeeNumber }) => employeeNumber === grader.employeeId)
        const course = courses.find((c) => c.id === rawEntry.courseId)
        const courseUnitRealisation = courseRealisations[rawEntry.id]
        const courseUnit = courseUnits[rawEntry.id]
        const grade = mapGrades(gradeScales, courseUnit.gradeScaleId, rawEntry)
        const completionDate = moment(rawEntry.attainmentDate).format('YYYY-MM-DD')

        if (!student) throw new Error(`Person with student number ${rawEntry.studentNumber} not found from Sisu`)
        if (!verifier) throw new Error(`Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`)
        if (!courseUnit) throw new Error(`No course unit found with course code ${rawEntry.course.courseCode}`)
        if (!courseUnitRealisation) throw new Error(`No active or past course unit realisation found with course code ${rawEntry.course.courseCode}`)
        if (!grade) throw new Error(`
            Invalid grade "${rawEntry.grade}". Available grades for this course are:
            ${gradeScales[courseUnit.gradeScaleId].map(({abbreviation}) => abbreviation['fi'])}
        `)

        if (!await isImprovedGrade(course.courseCode, rawEntry.studentNumber, Number(rawEntry.grade))) {
            throw new Error(`Student ${rawEntry.studentNumber} has already higher grade for course ${course.courseCode}`)
        }

        return Promise.resolve({
            personId: student.id,
            verifierPersonId: verifier.id,
            completionLanguage: rawEntry.language,
            rawEntryId: rawEntry.id,
            gradeId: grade.localId,
            completionDate,
            ...courseUnitRealisation,
            ...courseUnit
        })
    }))

    await db.entries.bulkCreate(data, { transaction })
    logger.info({ message: 'Entries success', amount: data.length, sis: true })
    return true
}

const mapGrades = (gradeScales, id, rawEntry) => {
    if (id === "sis-0-5") {
        return gradeScales[id].find(({numericCorrespondence}) => String(numericCorrespondence) === rawEntry.grade)
    } else if (id === "sis-hyl-hyv") {
        return gradeScales[id].find(({ abbreviation }) => abbreviation['fi'] === rawEntry.grade)
    }
}

// TODO: Create endpoint to db.api for batch converting employee ids
async function getEmployees(employeeIds) {
    const responses = await Promise.all(employeeIds.map(async (employeeId) => {
        const resp = await api.get(`employees/${employeeId}`)
        if (!resp.data.length)
            throw new Error(`No person found from Sisu with employee number ${employeeId}`)
        return resp
    }))
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
 * If the course has also an Open uni -version, map the ids for that too
 */
async function getCourseUnitRealisations(rawEntries) {
    const courses = await getCourses(rawEntries)

    const courseUnitRealisations = {}
    for (const course of courses) {
        let { courseCode } = course
        if (course.autoSeparate) {
            courseUnitRealisations[`AY${courseCode}`] = await fetchCourseUnitRealisation(`AY${courseCode}`)
        }
        courseUnitRealisations[courseCode] = await fetchCourseUnitRealisation(courseCode)
    }
    // TODO: We probably want to check if some course code is missing, not all...
    if (_.isEmpty(courseUnitRealisations)) throw new Error(`No course unit realisations found`)


    const courseRealisations = {}
    for (const rawEntry of rawEntries) {
        const { courseId, attainmentDate, id, isOpenUni } = rawEntry
        let { courseCode } = courses.find((c) => c.id === courseId)
        courseCode = isOpenUni ?
            `AY${courseCode}` :
            courseCode
        if (!courseUnitRealisations[courseCode]) throw new Error(`No course unit realisations in Sisu with the course code ${courseCode}`)
        const activeObject = resolveActiveObject(courseUnitRealisations[courseCode], attainmentDate)
        if (!activeObject) throw new Error(`No active course unit realisation in Sisu with the course code ${courseCode} for ${attainmentDate.toLocaleString()}`)

        const { assessmentItemIds, id: courseUnitRealisationId, name } = activeObject
        courseRealisations[id] = {
            courseUnitRealisationId: courseUnitRealisationId,
            assessmentItemId: assessmentItemIds[0],
            courseUnitRealisationName: name
        }
    }
    return courseRealisations
}

async function getCourseUnits(rawEntries) {
    const courses = await getCourses(rawEntries)

    const courseUnitData = {}
    for (const course of courses) {
        const { courseCode } = course
        if (course.autoSeparate) {
            courseUnitData[`AY${courseCode}`] = await fetchCourseUnit(`AY${courseCode}`)
        }
        courseUnitData[courseCode] = await fetchCourseUnit(courseCode)
    }
    // TODO: We probably want to check if some course code is missing, not all...
    if (_.isEmpty(courseUnitData)) throw new Error(`No course units found`)

    const courseUnits = {}
    for (const rawEntry of rawEntries) {
        const { courseId, attainmentDate, id, isOpenUni } = rawEntry
        let { courseCode } = courses.find((c) => c.id === courseId)
        courseCode = isOpenUni ?
            `AY${courseCode}` :
            courseCode
        if (!courseUnitData[courseCode]) throw new Error(`No course units in Sisu with the course code ${courseCode}`)

        const activeObject = resolveActiveObject(courseUnitData[courseCode], attainmentDate, 'validityPeriod')
        if (!activeObject) throw new Error(`No active course unit in Sisu with the course code ${courseCode}`)

        const { id: courseUnitId, gradeScaleId } = activeObject
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
    const courseIds = new Set(rawEntries.map(({ courseId }) => courseId))
    return await db.courses.findAll({
        where: {
            id: { [Op.in]: Array.from(courseIds) }
        }
    })
}

async function getGrades(codes) {
    try {
        const params = qs.stringify({ codes })
        const resp = await api.get(`grades?${params}`)
        return resp.data
    } catch (e) {
        if (e.response.data.status === 404) throw new Error(e.response.data.message)
        throw new Error(e.toString())
    }
}

module.exports = {
    processEntries
}
