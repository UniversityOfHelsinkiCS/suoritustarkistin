/**
 * Stuff related to sending stuff to Sisu
 */
const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')
const axios = require('axios')
const db = require('../models/index')
const { getAcceptorPersons, getAcceptorPersonsByCourseUnit } = require('../services/importer')


const URLS = {
  entries: 'suotar/',
  extra_entries: 'suotar/send/course-unit-attainment'
}

// Create an api instance if a different url for posting entries to Sisu is defined,
// otherwise use common api instance.
const API = process.env.POST_IMPORTER_DB_API_URL
  ? axios.create({
    headers: {
      token: process.env.IMPORTER_DB_API_TOKEN || ''
    },
    baseURL: process.env.POST_IMPORTER_DB_API_URL
  })
  : require('../config/importerApi')

/**
 *
 */
const attainmentsToSisu = async (model, verifier, { user, body }) => {
  const send = async (url, data, modelIds) => {
    logger.info({ message: 'Sending entries to Sisu', amount: data.length, user: user.name, payload: JSON.stringify(data) })
    await API.post(url, data)
    await updateSuccess(model, modelIds, senderId)
    logger.info({ message: 'All entries sent successfully to Sisu', successAmount: data.length })
    sendSentryMessage(`${data.length} entries sent successfully to Sisu!`, user)
  }

  const { entryIds, extraEntryIds } = body
  const senderId = user.id

  const id = model === 'entries' ? entryIds : extraEntryIds
  const rawData = await db[model].findAll({
    where: {
      id
    },
    include: ['rawEntry'],
    raw: true,
    nest: true
  })

  const acceptors = model === 'entries'
    ? await getAcceptorPersons(rawData.map(({ courseUnitRealisationId }) => courseUnitRealisationId))
    : await getAcceptorPersonsByCourseUnit(rawData.map(({ courseUnitId }) => courseUnitId))

  const data = model === 'entries'
    ? entriesToRequestData(rawData, verifier, acceptors)
    : extraEntriesToRequestData(rawData, verifier, acceptors)

  try {
    await send(URLS[model], data, id)
  } catch (e) {
    const payload = JSON.stringify(data)
    const errorMessage = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
    logger.error({ message: 'Error when sending entries to Sisu', errorMessage, payload })
    sendSentryMessage('Sending entries to Sisu failed', user, { errorMessage, payload: data })

    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: user.name })
      return [400, { message: e.response ? e.response.data : '', genericError: true, user: user.name }] //res.status(400).send({ message: e.response ? e.response.data : '', genericError: true, user: user.name })
    }
    const failedEntries = await writeErrorsToEntries(e.response, senderId)
    logger.info(`failedEntries ${failedEntries}`)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, user: user.name })

    // Entries without an error, is not sent successfully to Sisu so we need to send those a second time
    const successEntries = rawData
      .filter(({ id }) => !failedEntries.includes(id))
    logger.info(`new to send ${successEntries}`)
    if (!successEntries.length)
      return [400]

    try {
      const payload = entriesToRequestData(successEntries, verifier, acceptors)
      send(URLS[model], payload, successEntries.map(({ id }) => id))
    } catch (e) {
      const err = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
      logger.error({ message: 'Error when sending entries to Sisu round two', errorMessage: err, payload })
      sendSentryMessage(`Sending entries to Sisu failed! (Round 2)`, user, { payload, errorMessage: err })
    }
  }
  return [200]

}

// If the error is coming from Sisu
// it contains keys failingIds and violations
const isValidSisuError = (response) => {
  if (!response) return false
  const { failingIds, violations } = response.data
  return !!failingIds && !!violations
}

const parseSisuErrors = ({ failingIds, violations }) => {
  if (!failingIds || !violations) return null
  return failingIds.filter((id) => id !== "non-identifiable")
}

const writeErrorsToEntries = async ({ data }, senderId) => {
  const failingIds = parseSisuErrors(data) || data
  logger.info(`failingIds ${failingIds}`)
  await Promise.all(failingIds.map((id) => {
    db.entries.update({
      errors: { ...data.violations[id] },
      sent: new Date(),
      senderId
    }, {
      where: { id }
    })

  }))
  return failingIds
}

const updateSuccess = async (model, entryIds, senderId) =>
  await db[model].update({
    sent: new Date(),
    senderId,
    errors: null
  }, {
    where: {
      id: entryIds
    }
  })

const entriesToRequestData = (entries, verifier, acceptors) => entries.map((entry) => {
  const {
    id,
    personId,
    courseUnitRealisationId,
    assessmentItemId,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    rawEntry
  } = entry

  return {
    id,
    personId,
    verifierPersonId: verifier[0].id,
    acceptorPersons: acceptors[courseUnitRealisationId],
    courseUnitRealisationId,
    assessmentItemId,
    completionDate: rawEntry.attainmentDate,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    state: gradeId === '0' ? 'FAILED' : 'ATTAINED', // naive, 0 equals to failing grade
    credits: parseFloat(rawEntry.credits)
  }
})

const extraEntriesToRequestData = (extraEntries, verifier, acceptors) => extraEntries.map((entry) => {
  const {
    id,
    personId,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    rawEntry,
    studyRightId
  } = entry

  return {
    id,
    personId,
    studyRightId,
    verifierPersonId: verifier[0].id,
    acceptorPersons: acceptors[courseUnitId],
    attainmentDate: rawEntry.attainmentDate,
    registrationDate: new Date(),
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    state: 'ATTAINED',
    credits: parseFloat(rawEntry.credits)
  }
})

module.exports = attainmentsToSisu
