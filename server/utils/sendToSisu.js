/**
 * Stuff related to sending stuff to Sisu
 */
const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')
const axios = require('axios')
const moment = require('moment')
const db = require('../models/index')
const { getAcceptorPersons, getAcceptorPersonsByCourseUnit } = require('../services/importer')
const { ALLOW_SEND_TO_SISU } = require('../utils/common')

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
const attainmentsToSisu = async (model, { user, body }) => {
  const send = async (url, data, modelIds, uid) => {
    logger.info({ message: 'Sending entries to Sisu', amount: data.length, user: user.name, payload: JSON.stringify(data) })
    if (ALLOW_SEND_TO_SISU)
      await API.post(url, data)
    else logger.info(`Dry run, would send to Sisu: ${JSON.stringify(data)}`)
    await updateSuccess(model, modelIds, senderId)
    logger.info({ message: 'All entries sent successfully to Sisu', successAmount: data.length, sentToSisu: true, uid })
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
    ? entriesToRequestData(rawData, acceptors)
    : extraEntriesToRequestData(rawData, acceptors)

  try {
    await send(URLS[model], data, id, user.uid)
    return [200]
  } catch (e) {
    const payload = JSON.stringify(data)
    const errorMessage = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
    logger.error({ message: 'Error when sending entries to Sisu', errorMessage, payload })
    sendSentryMessage('Sending entries to Sisu failed', user, { errorMessage, payload: data })

    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: user.name })
      return [400, { message: e.response ? e.response.data : '', genericError: true, user: user.name }]
    }
    const failedEntries = await writeErrorsToEntries(e.response, senderId, model)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, user: user.name })

    // Entries without an error, is not sent successfully to Sisu so we need to send those a second time
    const successEntries = rawData
      .filter(({ id }) => !failedEntries.includes(id))
    if (!successEntries.length)
      return [400, { message: 'Some entries failed in Sisu' }]

    try {
      const payload = model === 'entries'
        ? entriesToRequestData(successEntries, acceptors)
        : extraEntriesToRequestData(successEntries, acceptors)
      send(URLS[model], payload, successEntries.map(({ id }) => id), user.uid)
    } catch (e) {
      const err = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
      logger.error({ message: 'Error when sending entries to Sisu round two', errorMessage: err, payload })
      sendSentryMessage(`Sending entries to Sisu failed! (Round 2)`, user, { payload, errorMessage: err })
      return [400, { message: 'No entries sent to Sisu' }]
    }
  }
  return [400, { message: 'Some entries failed in Sisu' }]

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

const writeErrorsToEntries = async ({ data }, senderId, model) => {
  const failingIds = parseSisuErrors(data) || data
  logger.info(`failingIds ${failingIds}`)
  await Promise.all(failingIds.map((id) => {
    db[model].update({
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

const entriesToRequestData = (entries, acceptors) => entries.map((entry) => {
  const {
    id,
    personId,
    courseUnitRealisationId,
    assessmentItemId,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    completionDate,
    rawEntry
  } = entry

  return {
    id,
    personId,
    acceptorPersons: acceptors[courseUnitRealisationId],
    courseUnitRealisationId,
    assessmentItemId,
    completionDate,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    state: gradeId === '0' ? 'FAILED' : 'ATTAINED', // naive, 0 equals to failing grade
    credits: parseFloat(rawEntry.credits)
  }
})

const extraEntriesToRequestData = (extraEntries, acceptors) => extraEntries.map((entry) => {
  const {
    id,
    personId,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId,
    completionDate,
    rawEntry,
    studyRightId
  } = entry

  return {
    acceptorPersons: acceptors[courseUnitId],
    attainmentDate: moment(completionDate).format('YYYY-MM-DD'),
    registrationDate: moment().format('YYYY-MM-DD'),
    state: 'ATTAINED',
    credits: parseFloat(rawEntry.credits),
    privateComment: 'Kurjen kautta tuotu erilliskirjaus',
    id,
    personId,
    studyRightId,
    completionLanguage,
    courseUnitId,
    gradeScaleId,
    gradeId
  }
})

module.exports = attainmentsToSisu
