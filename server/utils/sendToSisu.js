/**
 * Stuff related to sending stuff to Sisu
 */
const logger = require('@server/utils/logger')
const { sendSentryError } = require('@server/utils/sentry')
const axios = require('axios')
const moment = require('moment')
const db = require('../models/index')
const { getAcceptorPersons, getAcceptorPersonsByCourseUnit } = require('../services/importer')
const { httpAgent, httpsAgent } = require('../config/httpAgents')
const { ALLOW_SEND_TO_SISU } = require('./common')

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
      baseURL: process.env.POST_IMPORTER_DB_API_URL,
      timeout: 600_000,
      httpAgent,
      httpsAgent
    })
  : require('../config/importerApi')

// A network-level failure (socket hang up, ECONNRESET) has no `.response`, and the
// axios error is circular via request -> agent -> socket -> _httpMessage, so
// JSON.stringify would throw a TypeError from inside the catch.
const describeError = (e) =>
  e.response ? JSON.stringify(e.response.data || null) : JSON.stringify({ message: e.message, code: e.code })

const DUPLICATE_ATTAINMENT = /duplicate key value violates unique constraint "attainment_pkey"/

const genericErrorMessage = (e) => {
  const body = e.response ? JSON.stringify(e.response.data || '') : ''
  if (DUPLICATE_ATTAINMENT.test(body))
    return 'These completions are already registered in Sisu. Use "Refresh from Sisu" to update their status.'
  return e.response ? `Sisu responded with status ${e.response.status}` : e.message
}

// If the error is coming from Sisu
// it contains keys failingIds and violations
const isValidSisuError = (response) => {
  if (!response || !response.data) return false
  const { failingIds, violations } = response.data
  return !!failingIds && !!violations
}

const parseSisuErrors = ({ failingIds, violations }) => {
  if (!failingIds || !violations) return null
  return failingIds.filter((id) => id !== 'non-identifiable')
}

const writeErrorsToEntries = async ({ data }, senderId, model) => {
  const failingIds = parseSisuErrors(data) || data
  logger.info(`failingIds ${failingIds}`)
  await Promise.all(
    failingIds.map((id) =>
      db[model].update(
        {
          errors: { ...data.violations[id] },
          sent: new Date(),
          sendState: 'REJECTED',
          senderId
        },
        {
          where: { id }
        }
      )
    )
  )
  return failingIds
}

const updateSuccess = async (model, entryIds, senderId) =>
  await db[model].update(
    {
      sent: new Date(),
      sendState: 'ACCEPTED',
      senderId,
      errors: null
    },
    {
      where: {
        id: entryIds
      }
    }
  )

const entriesToRequestData = (entries, acceptors) =>
  entries.map((entry) => {
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
      credits: parseFloat(rawEntry.credits.replace(',', '.'))
    }
  })

const extraEntriesToRequestData = (extraEntries, acceptors) =>
  extraEntries.map((entry) => {
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
      credits: parseFloat(rawEntry.credits.replace(',', '.')),
      administrativeNote: 'Kurjen kautta tuotu erilliskirjaus',
      attainmentLanguageUrn: `urn:code:language:${completionLanguage}`,
      studyFieldUrn: 'urn:code:study-field:okm-7',
      id,
      personId,
      studyRightId,
      courseUnitId,
      gradeScaleId,
      gradeId
    }
  })

/**
 * `acceptors`, when given, is used instead of looking them up here. `timeout`, when given,
 * bounds the send for a caller that cannot wait out the instance default.
 */
const attainmentsToSisu = async (model, { user, body, acceptors: prefetchedAcceptors, timeout }) => {
  const { entryIds, extraEntryIds } = body
  const senderId = user.id

  const send = async (url, data, modelIds, uid) => {
    logger.info({
      message: 'Sending entries to Sisu',
      amount: data.length,
      user: user.name,
      payload: JSON.stringify(data)
    })
    if (ALLOW_SEND_TO_SISU) {
      // Recorded before the request leaves. If nothing comes back, or this process dies before
      // updateSuccess runs, the entry says it was attempted rather than looking untouched --
      // which is the difference between "safe to resend" and "might duplicate in Sisu".
      await db[model].update({ sendState: 'ATTEMPTED' }, { where: { id: modelIds } })
      await API.post(url, data, timeout ? { timeout } : undefined)
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      logger.info(`Dry run, would send to Sisu: ${JSON.stringify(data)}`)
    }
    await updateSuccess(model, modelIds, senderId)
    logger.info({ message: 'All entries sent successfully to Sisu', successAmount: data.length, sentToSisu: true, uid })
  }

  const requestedIds = model === 'entries' ? entryIds : extraEntryIds
  const requested = await db[model].findAll({
    where: {
      id: requestedIds
    },
    include: ['rawEntry'],
    raw: true,
    nest: true
  })

  const rawData = requested.filter(({ sent, errors }) => !sent || errors)
  const alreadySent = requested.length - rawData.length
  if (alreadySent)
    logger.info({ message: 'Skipping entries already sent to Sisu', skippedAmount: alreadySent, user: user.name })
  if (!rawData.length) return [200, { message: 'success' }]

  const id = rawData.map((entry) => entry.id)

  const acceptors =
    prefetchedAcceptors ??
    (model === 'entries'
      ? await getAcceptorPersons(rawData.map(({ courseUnitRealisationId }) => courseUnitRealisationId))
      : await getAcceptorPersonsByCourseUnit(rawData.map(({ courseUnitId }) => courseUnitId)))

  const data =
    model === 'entries' ? entriesToRequestData(rawData, acceptors) : extraEntriesToRequestData(rawData, acceptors)

  try {
    await send(URLS[model], data, id, user.uid)
    return [200, { message: 'success' }]
  } catch (e) {
    const payload = JSON.stringify(data)
    const errorMessage = describeError(e)
    logger.error({ message: 'Error when sending entries to Sisu', errorMessage, payload })

    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: user.name })
      sendSentryError('Sending entries to Sisu failed', e, { user, errorMessage, payload: data })
      return [400, { message: genericErrorMessage(e), genericError: true, user: user.name }]
    }
    const failedEntries = await writeErrorsToEntries(e.response, senderId, model)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, user: user.name })

    // Entries without an error, is not sent successfully to Sisu so we need to send those a second time
    const successEntries = rawData.filter(({ id }) => !failedEntries.includes(id))
    if (!successEntries.length) return [400, { message: 'Some entries failed in Sisu' }]

    try {
      const payload =
        model === 'entries'
          ? entriesToRequestData(successEntries, acceptors)
          : extraEntriesToRequestData(successEntries, acceptors)
      await send(
        URLS[model],
        payload,
        successEntries.map(({ id }) => id),
        user.uid
      )
    } catch (e) {
      const err = describeError(e)
      logger.error({ message: 'Error when sending entries to Sisu round two', errorMessage: err, payload })
      sendSentryError('Sending entries to Sisu failed (round two)', e, { user, payload, errorMessage: err })
      return [400, { message: 'No entries sent to Sisu' }]
    }
  }
  return [400, { message: 'Some entries failed in Sisu' }]
}

module.exports = attainmentsToSisu
