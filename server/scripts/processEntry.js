
const db = require('../models/index')
const Sequelize = require('sequelize')
const axios = require('axios')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')

const api = axios.create({
    headers: {
        token: process.env.IMPORTER_DB_API_TOKEN || ''
    },
    baseURL: process.env.IMPORTER_DB_API_URL
})

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

    const data = createdEntries.map((rawEntry) => {
        const student = students.data.find(({studentNumber}) => studentNumber === rawEntry.studentNumber)
        const grader = graders.find((g) => g.id === rawEntry.graderId)
        const verifier = employees.find(({employeeNumber}) => employeeNumber === grader.employeeId)
        const courseUnitRealisation = courseRealisations[rawEntry.courseId]
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
            ...courseUnitRealisation
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
 * Map course unit realisation id and assessment item id to course id in Suotar db.
 * Note: mapping is not done with course code, as course coude is not accessible form raw entry
 */
async function getCourseUnitRealisations(rawEntries) {
    const courses = await getCourses(rawEntries)

    const courseRealisations = {}
    for (const rawEntry of rawEntries) {
        const {courseId, attainmentDate} = rawEntry
        const course = courses.find((c) => c.id === courseId)
        const {id, assessmentItemIds} = await resolveCourseUnitRealisation(course.courseCode, attainmentDate)
        courseRealisations[courseId] = {
            courseUnitRealisationId: id,
            assessmentItemId: assessmentItemIds[0]
        }
    }
    return courseRealisations
}

/**
 * Get active course unit realisation by course code and date.
 * If no active found, return closest already ended realisation.
 */
async function resolveCourseUnitRealisation(courseCode, date) {
    try {
        const momentDate = moment(date)
        const resp = await api.get(`course_unit_realisations/?code=${courseCode}`)
        const active = resp.data.find((realisation) => {
            const { startDate, endDate } = realisation.activityPeriod
            return momentDate.isBetween(moment(startDate), moment(endDate))
        })
        if (active) return active[0]

        return resp.data
            .filter(({activityPeriod}) => moment(activityPeriod.endDate).isBefore(momentDate))
            .sort((a, b) => moment(b.activityPeriod.endDate).diff(moment(a.activityPeriod.endDate)))[0]
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
