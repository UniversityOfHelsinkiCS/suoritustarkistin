const qs = require('querystring')
const _ = require('lodash')
const api = require('../config/importerApi')
const logger = require('../utils/logger')

const handleImporterApiErrors = (e) => {
  if (e.code === 'EAI_AGAIN') throw new Error('Network error. Reload the page and try again')
  if (e.response.data.status === 404) throw new Error(e.response.data.message)
  throw new Error(e.toString())
}

const chunkifyApi = async (data, url, size = 10) => {
  let allData = []
  const chunks = _.chunk(data, size)
  // eslint-disable-next-line no-restricted-syntax
  for (const chunk of chunks) {
    const res = await api.post(url, chunk)
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
 * The data must be fetched in chunks of 50, since importer-api cannot handle bigger payloads.
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
 * The data must be fetched in chunks of 50, since importer-api cannot handle bigger payloads.
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

const getCourseUnitEnrolments = async (code) => {
  try {
    const { data } = await api.get(`suotar/course-unit-enrolments/${code}`)
    return data
  } catch (e) {
    handleImporterApiErrors(e)
  }
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
  getMultipleStudyRightsByPersons,
  getCourseUnitEnrolments
}
