const qs = require('querystring')
const _ = require('lodash')
const api = require('../config/importerApi')
const logger = require('../utils/logger')

const IMPORTER_POST_RETRY_LIMIT = 3

const handleImporterApiErrors = (e) => {
  if (e.code === 'EAI_AGAIN') throw new Error('Network error. Reload the page and try again')
  if (!e.response) throw new Error(`Importer request failed: ${e.code || e.message}`)

  const { data } = e.response
  if (data && data.status === 404) throw new Error(data.message)
  throw new Error(e.toString())
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const postWithRetry = async (url, chunk) => {
  for (let attempt = 1; attempt <= IMPORTER_POST_RETRY_LIMIT; attempt++) {
    try {
      return await api.post(url, chunk)
    } catch (e) {
      if (e.response || attempt === IMPORTER_POST_RETRY_LIMIT) throw e
      logger.info({
        message: `Importer request to ${url} failed (${e.code || e.message}). Attempt ${attempt} of ${IMPORTER_POST_RETRY_LIMIT}`
      })
      await sleep(attempt * 1000)
    }
  }
}

const chunkifyApi = async (data, url) => {
  let allData = []
  const size = 10
  const chunks = _.chunk(data, size)
  for (const chunk of chunks) {
    const res = await postWithRetry(url, chunk)
    allData = _.concat(allData, res.data)
  }
  return allData
}

// TODO: Create endpoint to db.api for batch converting employee ids
async function getEmployees(employeeIds) {
  const responses = await Promise.all(
    employeeIds.map(async (employeeId) => {
      const resp = await api.get(`employees/${employeeId}`)
      if (!resp.data || !resp.data.length)
        throw new Error(`No person found from Sisu with employee number ${employeeId}`)
      return resp
    })
  )
  return _.flatten(responses.map((resp) => resp.data))
}

async function getStudents(studentNumbers) {
  try {
    const res = await api.post('students/', studentNumbers)
    return res.data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getEnrolments(studentCourseCodes) {
  try {
    return await chunkifyApi(studentCourseCodes, 'suotar/enrolments/')
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getGrades(codes = []) {
  const uniqueCodes = _.uniq(codes)
  try {
    const params = qs.stringify({ codes: uniqueCodes })
    const resp = await api.get(`grades?${params}`)
    return resp.data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getAcceptorPersons(courseUnitRealisationIds) {
  try {
    const { data } = await api.post(`suotar/acceptors/`, courseUnitRealisationIds)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getAcceptorPersonsByCourseUnit(courseUnitIds) {
  try {
    const { data } = await api.post(`suotar/acceptors/course-unit`, courseUnitIds)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function resolveUser(formData) {
  try {
    const { data } = await api.post(`suotar/resolve_user/`, formData)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

/**
 * Returns a list of objects { studentNumber, courseCode, earlierAttainments }.
 * The data must be fetched in chunks of 10, since importer-api cannot handle bigger payloads.
 */
const getEarlierAttainments = async (data) => {
  logger.info({ message: `Fetching earlier attainments from importer for ${data ? data.length : 0} students` })
  if (!data) return []
  try {
    return await chunkifyApi(data, 'suotar/attainments')
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

/**
 * Returns a list of objects { studentNumber, courseCode, earlierAttainments }.
 * The data must be fetched in chunks of 10, since importer-api cannot handle bigger payloads.
 */
const getEarlierAttainmentsWithoutSubstituteCourses = async (data) => {
  logger.info({ message: `Fetching earlier attainments from importer for ${data ? data.length : 0} students` })
  if (!data) return []
  try {
    return await chunkifyApi(data, 'suotar/attainments?noSubstitutions=true')
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getStudentsWithStudyRight = async (studentNumbers) => {
  try {
    const { data } = await api.post(`students/study-rights`, studentNumbers)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getResponsibles(courseCode) {
  try {
    const { data } = await api.get(`suotar/responsibles/${courseCode}`)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getStudyRight = async (id) => {
  try {
    const { data } = await api.get(`suotar/study-right/${id}`)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getMultipleStudyRights = async (studyRightIds) => {
  try {
    const { data } = await api.post(`suotar/study-rights`, studyRightIds)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getMultipleStudyRightsByPersons = async (persons) => {
  try {
    const { data } = await api.post(`suotar/study-rights-by-person`, persons)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getCourseUnitIds = async (codes) => {
  try {
    const { data } = await api.post(`suotar/course-unit-ids`, codes)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const activityPeriodCutoff = () => {
  const now = new Date()
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(now.getMonth() - 2)
  return twoMonthsAgo
}

const isActiveRealisation = (item, cutoff) => {
  if (!item.activityPeriod || !item.activityPeriod.endDate) return false
  return new Date(item.activityPeriod.endDate) >= cutoff
}

const getAllCourseUnitEnrolments = async (code) => {
  try {
    const { data } = await api.get(`suotar/course-unit-enrolments/${code}`)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

const getCourseUnitEnrolments = async (code) => {
  const data = await getAllCourseUnitEnrolments(code)
  const cutoff = activityPeriodCutoff()
  const filteredData = data.filter((item) => isActiveRealisation(item, cutoff))

  const enrolments = (realisations) => realisations.reduce((sum, r) => sum + (r.enrollments || []).length, 0)

  logger.info({
    message: `Sisu enrolments for ${code}: kept ${filteredData.length}/${data.length} realisations, ${enrolments(filteredData)}/${enrolments(data)} enrolments (activityPeriod cutoff ${cutoff.toISOString().slice(0, 10)})`
  })

  return filteredData
}

module.exports = {
  getEmployees,
  getStudents,
  getEnrolments,
  getGrades,
  getEarlierAttainments,
  getEarlierAttainmentsWithoutSubstituteCourses,
  getAcceptorPersons,
  resolveUser,
  getResponsibles,
  getStudyRight,
  getMultipleStudyRights,
  getStudentsWithStudyRight,
  getAcceptorPersonsByCourseUnit,
  getCourseUnitIds,
  getAllCourseUnitEnrolments,
  activityPeriodCutoff,
  isActiveRealisation,
  getMultipleStudyRightsByPersons,
  getCourseUnitEnrolments
}
