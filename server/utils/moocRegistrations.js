/**
 * Registrations for a mooc course come from two independent sources — Sisu (via
 * importer) and eduweb — and neither is authoritative on its own: a course may exist
 * in one, the other, or both. The only link from a mooc completion back to a student
 * is the email address, and each source carries a different set of addresses for the
 * same person.
 *
 * So instead of picking a source, we collapse both into one record per student
 * number holding every known address:
 *
 *   { studentNumber: '014123456', emails: ['matti@helsinki.fi', 'matti@gmail.com'] }
 *
 * Matching is then a lookup on any of them. Names are dropped — processEntries
 * re-fetches those from Sisu by student number.
 */

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return normalized || null
}

const normalizeStudentNumber = (studentNumber) => {
  if (studentNumber === null || studentNumber === undefined) return null
  return String(studentNumber).trim() || null
}

/**
 * fromSisuEnrolments and fromEduwebRegistrations must both return the same shape of data
 * { studentNumber: string; emails: string[] }[] (i miss typescript ;_;)
 */

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
 * Merges normalized records from every source into one person per student number.
 *
 * `sources` is [{ source: 'sisu', records: [...] }, ...]. Order matters twice: on an
 * email claimed by two different student numbers the earlier source wins, and the
 * caller sees the loser in `stats.collisions`. Sisu should therefore come first, as
 * it is the authority on student numbers.
 */
const mergeRegistrations = (sources) => {
  const personsByStudentNumber = new Map()
  const byEmail = new Map() // email -> studentNumber
  const unidentifiedEmails = new Map()
  // statistics
  const collisions = []
  const perSource = {}

  for (const { source, records } of sources) {
    perSource[source] = { records: records.length, emails: 0 }

    for (const record of records) {
      const studentNumber = normalizeStudentNumber(record.studentNumber)
      const emails = [...new Set(record.emails.map(normalizeEmail).filter(Boolean))]
      perSource[source].emails += emails.length

      // Registered, but the student number never came through. Kept aside so a
      // completion matching one of these can still be reported as such.
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
          collisions.push({ email, keptStudentNumber: owner.studentNumber, ignoredStudentNumber: studentNumber })
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

const findByEmail = (registrations, email) => registrations.byEmail.get(normalizeEmail(email)) || null

const isUnidentified = (registrations, email) => registrations.unidentifiedEmails.has(normalizeEmail(email))

module.exports = {
  normalizeEmail,
  fromSisuEnrolments,
  fromEduwebRegistrations,
  mergeRegistrations,
  findByEmail,
  isUnidentified
}
