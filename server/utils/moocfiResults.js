/**
 * The courses.mooc.fi batch API's result vocabulary: every code the API can answer, the
 * wording that goes with it, and the builders that put them in the envelope.
 *
 * One place on purpose. The codes are a contract with mooc.fi, and the same outcome is
 * reached from several endpoints -- a person that does not exist is answered by sections 1,
 * 2 and 3 alike -- so a literal per call site is a wording that drifts.
 *
 * Section numbers refer to the spec; documentation/moocfi-api-deviations.md records where
 * this implementation departs from it.
 */

const { sendSentryError } = require('./sentry')

// Request-level codes. These describe a request that could not be answered at all, so they
// answer `{ error: { code, message } }` with a 4xx or 5xx rather than per-item results.
const REQUEST_CODES = {
  malformedRequest: 'malformedRequest',
  requestTooLarge: 'requestTooLarge',
  unauthorized: 'unauthorized',
  internalError: 'internalError',
  // Every endpoint that reads Sisu (1, 2, 3, 4, 6). The lookups behind them are batch-wide,
  // so a failure takes down the whole request and there is no per-item outcome to report.
  serviceTemporarilyUnavailable: 'serviceTemporarilyUnavailable'
}

// Per-item codes, always answered with HTTP 200.
const CODES = {
  // 1: persons/resolve-by-student-numbers
  personFound: 'personFound',
  personNotFound: 'personNotFound',

  // 2: enrolments/resolve
  enrolmentFound: 'enrolmentFound',
  courseCodeNotFound: 'courseCodeNotFound',
  enrolmentNotFound: 'enrolmentNotFound',
  enrolmentNotAccepted: 'enrolmentNotAccepted',

  // 3: attainments/import
  sent: 'sent',
  duplicateAttainment: 'duplicateAttainment',
  notImprovedAttainment: 'notImprovedAttainment',
  courseNotAllowed: 'courseNotAllowed',
  invalidCredits: 'invalidCredits',
  invalidGradeForGradeScale: 'invalidGradeForGradeScale',
  studyRightNotValid: 'studyRightNotValid',
  sisuValidationFailed: 'sisuValidationFailed',
  sisuTimeout: 'sisuTimeout',
  // Not a spec code: the spec has mooc.fi carry the retry risk, which it cannot do while the
  // data it is told to verify against lags behind Sisu.
  submissionPending: 'submissionPending',

  // 4: attainments/verify
  registered: 'registered',
  notRegistered: 'notRegistered',
  misregistered: 'misregistered',

  // 6: enrolments/list-by-course
  enrolmentsListed: 'enrolmentsListed'
}

/**
 * The fixed wording per code. A code whose message names the item that failed -- credits
 * outside the course's range, a course code Suotar does not carry -- has no entry here and
 * is given its message at the call site instead.
 */
const MESSAGES = {
  [REQUEST_CODES.requestTooLarge]: 'Request body is too large.',
  [REQUEST_CODES.unauthorized]: 'Missing or invalid credentials.',
  [REQUEST_CODES.internalError]: 'Suotar failed to process the request.',
  [REQUEST_CODES.serviceTemporarilyUnavailable]: 'Failed to fetch Sisu data.',

  [CODES.personNotFound]: 'No Sisu person was found for the supplied student number.',
  [CODES.courseCodeNotFound]: 'Course code could not be resolved in Sisu.',
  // Section 3 has the caller name the enrolment it picked in section 2, so it says so itself.
  [CODES.enrolmentNotFound]: 'No Sisu enrolment was found for this person and course.',
  [CODES.enrolmentNotAccepted]: 'The Sisu enrolment has not been accepted.',

  [CODES.invalidGradeForGradeScale]: "Grade id is not valid for the resolved enrolment's grade scale.",
  [CODES.studyRightNotValid]: 'Study right cannot support the attainment.',
  [CODES.sisuTimeout]: 'Sisu operation timed out; outcome is uncertain.',
  [CODES.submissionPending]:
    'This completion was submitted recently and its outcome is not yet confirmed. Verify before retrying.',

  [CODES.notRegistered]: 'No final or partial Sisu registration evidence was found for the submitted attainment id.',
  [CODES.misregistered]: 'A previously registered attainment has been marked misregistered in Sisu.'
}

const okItem = (requestItemId, code, result) => ({ requestItemId, status: 'ok', code, result })

/**
 * `message` defaults to the code's own wording; pass one only for a code whose message names
 * the item. `result` is for the two codes that report an error and still hand back the
 * submission it concerns (sisuTimeout, submissionPending).
 */
const errorItem = (requestItemId, code, { message = MESSAGES[code], result } = {}) => {
  if (!message) throw new Error(`No message for result code ${code}`)

  const item = { requestItemId, status: 'error', code, error: { message } }
  return result ? { ...item, result } : item
}

// Thrown past the endpoint to batchApi, which answers it 503 serviceTemporarilyUnavailable.
class ServiceUnavailableError extends Error {}

/**
 * Reports one importer failure and returns the error to throw for it. Every lookup behind
 * these endpoints is batch-wide, so nothing is left to answer per item.
 */
const serviceUnavailable = (title, error, context) => {
  sendSentryError(title, error, context)
  return new ServiceUnavailableError(MESSAGES[REQUEST_CODES.serviceTemporarilyUnavailable], { cause: error })
}

/**
 * The importer answering the wrong shape is a failure like any other: thrown here, caught by
 * the endpoint, answered as serviceTemporarilyUnavailable.
 */
const requireImporterArray = (value, what) => {
  if (!Array.isArray(value)) throw new Error(`Importer returned ${typeof value} instead of an array of ${what}`)
  return value
}

module.exports = {
  REQUEST_CODES,
  CODES,
  MESSAGES,
  okItem,
  errorItem,
  ServiceUnavailableError,
  serviceUnavailable,
  requireImporterArray
}
