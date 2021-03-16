const api = require('../config/importerApi')
const qs = require('querystring')
const _ = require('lodash')

const handleImporterApiErrors = (e) => {
  if (e.code === "EAI_AGAIN") throw new Error("Network error. Reload the page and try again")
  if (e.response.data.status === 404) throw new Error(e.response.data.message)
  throw new Error(e.toString())
}

// TODO: Create endpoint to db.api for batch converting employee ids
async function getEmployees(employeeIds) {
  const responses = await Promise.all(employeeIds.map(async (employeeId) => {
    const resp = await api.get(`employees/${employeeId}`)
    if (!resp.data || !resp.data.length)
      throw new Error(`No person found from Sisu with employee number ${employeeId}`)
    return resp
  }))
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
    const res = await api.post('suotar/enrolments/', studentCourseCodes)
    return res.data
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

/**
 * Returns a list of objects { studentNumber, courseCode, earlierAttainments }.
 * The data must be fetched in chunks of 100, since importer-api cannot handle bigger payloads. 
 */
const getEarlierAttainments = async (data) => {
  let allData = []
  try {
    const chunks = _.chunk(data, 150)
    for (const chunk of chunks) {
      const res = await api.post(`suotar/attainments`, chunk)
      allData = _.concat(allData, res.data)
    }
    return allData
  } catch (e) {
    if (e.response.data.status === 404) throw new Error(e.response.data.message)
    throw new Error(e.toString())
  }
}

module.exports = {
  getEmployees,
  getStudents,
  getEnrolments,
  getGrades,
  getEarlierAttainments,
  getAcceptorPersons
}