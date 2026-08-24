/**
 * Mooc registrations come from two sources, Sisu (via importer) and eduweb, and neither
 * is authoritative: a course may exist in one, the other, or both. Eduweb will become
 * deprecated in the near(ish) fututre. The only link from a completion back to a student
 * is the email address, and each source knows a different set of addresses for the same
 * person. So rather than pick a source we collapse both into one `person` record per student
 * number holding every known address:
 *
 *   { studentNumber: '014123456', emails: ['matti@helsinki.fi', 'matti@gmail.com'] }
 *
 * Matching is a lookup on any of them. Names are dropped; processEntries re-fetches
 * those from Sisu by student number.
 */

const logger = require('@server/utils/logger')
const { getCourseUnitEnrolments } = require('../services/importer')
const { getRegistrations } = require('../services/eduweb')

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return normalized || null
}

const normalizeStudentNumber = (studentNumber) => {
  if (studentNumber === null || studentNumber === undefined) return null
  return String(studentNumber).trim() || null
}

// Both source adapters must return { studentNumber, emails: [] }[] for mergeRegistrations.
const fromSisuEnrolments = (realisations) =>
  (realisations || []).flatMap((realisation) =>
    (realisation.enrollments || []).map(({ person }) => ({
      studentNumber: person && person.studentNumber,
      emails: person ? [person.primaryEmail, person.secondaryEmail] : []
    }))
  )

const fromEduwebRegistrations = (registrations) =>
  (registrations || []).filter(Boolean).map((registration) => ({
    studentNumber: registration.onro,
    emails: [registration.email, registration.mooc]
  }))

/**
 * Merges [{ source, records }] into one person per student number. Source order decides
 * collisions: an email claimed by two student numbers goes to the earlier source, and the
 * loser is reported in `stats.collisions`.
 */
const mergeRegistrations = (sources) => {
  const personsByStudentNumber = new Map()
  const byEmail = new Map() // email -> person
  const unidentifiedEmails = new Map() // email -> source
  const collisions = []
  const perSource = {}

  for (const { source, records } of sources) {
    perSource[source] = { records: records.length, emails: 0 }

    for (const record of records) {
      const studentNumber = normalizeStudentNumber(record.studentNumber)
      const emails = [...new Set(record.emails.map(normalizeEmail).filter(Boolean))]
      perSource[source].emails += emails.length

      // Registered, but no student number came through. Kept aside so a completion
      // matching one of these can still be reported as such rather than as unmatched.
      if (!studentNumber) {
        for (const email of emails) if (!unidentifiedEmails.has(email)) unidentifiedEmails.set(email, source)
        continue
      }

      let person = personsByStudentNumber.get(studentNumber)
      if (!person) {
        person = { studentNumber, emails: [] }
        personsByStudentNumber.set(studentNumber, person)
      }

      for (const email of emails) {
        const owner = byEmail.get(email)
        if (owner === person) continue
        if (owner) {
          collisions.push({
            email,
            keptStudentNumber: owner.studentNumber,
            ignoredStudentNumber: studentNumber
          })
          continue
        }
        byEmail.set(email, person)
        person.emails.push(email)
      }
    }
  }

  const persons = [...personsByStudentNumber.values()]

  return {
    persons,
    byEmail,
    unidentifiedEmails,
    stats: {
      perSource,
      persons: persons.length,
      emails: byEmail.size,
      unidentified: unidentifiedEmails.size,
      collisions
    }
  }
}

const fetchRegistrationsFor = async (code) => {
  const [sisu, eduweb] = await Promise.allSettled([getCourseUnitEnrolments(code), getRegistrations(code)])

  if (sisu.status === 'rejected' && eduweb.status === 'rejected') {
    throw new Error(
      `No registrations available for ${code}: sisu failed with "${sisu.reason?.message}", eduweb failed with "${eduweb.reason?.message}"`
    )
  }

  for (const [name, result] of [
    ['sisu', sisu],
    ['eduweb', eduweb]
  ]) {
    if (result.status === 'rejected')
      logger.warn({
        message: `${code}: no registrations from ${name}, continuing without them: ${result.reason?.message}`
      })
  }

  // Sisu first: it is the authority on student numbers, so it wins email collisions.
  const registrations = mergeRegistrations([
    {
      source: 'sisu',
      records: sisu.status === 'fulfilled' ? fromSisuEnrolments(sisu.value) : []
    },
    {
      source: 'eduweb',
      records: eduweb.status === 'fulfilled' ? fromEduwebRegistrations(eduweb.value) : []
    }
  ])

  const { perSource, persons, emails, unidentified, collisions } = registrations.stats
  const perSourceSummary = ({ records, emails: sourceEmails }) => (records ? `${records}/${sourceEmails}` : 'none')
  logger.info({
    message: `${code}: registrations sisu ${perSourceSummary(perSource.sisu)}, eduweb ${perSourceSummary(perSource.eduweb)} (rows/emails) -> ${persons} students, ${emails} emails${unidentified ? `, ${unidentified} without student number` : ''}`
  })

  for (const { email, keptStudentNumber, ignoredStudentNumber } of collisions)
    logger.warn({
      message: `${code}: email ${email} is claimed by both ${keptStudentNumber} and ${ignoredStudentNumber}, using ${keptStudentNumber}`
    })

  return registrations
}

const courseStudentPairs = (persons, courseCode) =>
  persons.filter(({ studentNumber }) => studentNumber).map(({ studentNumber }) => ({ courseCode, studentNumber }))

/** The person owning `email`: { studentNumber, emails: string[] }, or null if unknown. */
const findByEmail = (registrations, email) => registrations.byEmail.get(normalizeEmail(email)) || null

const isUnidentified = (registrations, email) => registrations.unidentifiedEmails.has(normalizeEmail(email))

module.exports = {
  normalizeEmail,
  fetchRegistrationsFor,
  courseStudentPairs,
  findByEmail,
  isUnidentified
}
