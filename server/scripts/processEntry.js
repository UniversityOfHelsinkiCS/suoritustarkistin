
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

const processEntries = async (createdEntries, senderId) => {
    const rawEntries = await db.raw_entries.findAll({
        where: {
            id: {
                [Op.in]: createdEntries.map(({id}) => id)
            }
        },
        include: ["course", "reporter", "grader"]
    })

    const studentNumbers = rawEntries.map((rawEntry) => rawEntry.studentNumber)
    const graderIds = new Set(rawEntries.map((rawEntry) => rawEntry.graderId))
    const graders = await db.users.findAll({
        where: {
            id: {[Op.in]: Array.from(graderIds)}
        }
    })
    const employeeIds = graders.map((grader) => grader.employeeId)

    const students = await api.post('students/', studentNumbers)
    const employees = await getEmployees(employeeIds)

    const courseRealisations = {}
    for (const rawEntry of rawEntries) {
        const {course, attainmentDate} = rawEntry
        const {id, assessmentItemIds} = await resolveCourseUnitRealisation(course.courseCode, attainmentDate)
        courseRealisations[course.courseCode] = {
            courseUnitRealisationId: id,
            assessmentItemId: assessmentItemIds[0]
        }
    }

    const data = rawEntries.map((rawEntry) => {
        const student = students.data.find(({studentNumber}) => studentNumber === rawEntry.studentNumber)
        const verifier = employees.find(({employeeNumber}) => employeeNumber === rawEntry.grader.employeeId)
        const courseUnitRealisation = courseRealisations[rawEntry.course.courseCode]
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

    await db.entries.bulkCreate(data)
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
 * Get active course unit realisation by course code and date.
 * If no active found, return closest already ended realisation.
 */
async function resolveCourseUnitRealisation(courseCode, date) {
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
}

module.exports = {
    processEntries
}
