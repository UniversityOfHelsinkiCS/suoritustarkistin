/**
 * Every way processEntries can reject a completion, and how loudly each one should be reported.
 */
const FAILURE_REASONS = {
  MISSING_ENROLMENT: 'MISSING_ENROLMENT',
  DUPLICATE_COMPLETION: 'DUPLICATE_COMPLETION',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  NO_VALID_ATTAINMENT_DATE: 'NO_VALID_ATTAINMENT_DATE',
  VERIFIER_NOT_FOUND: 'VERIFIER_NOT_FOUND',
  INVALID_GRADE: 'INVALID_GRADE',
  INVALID_CREDITS: 'INVALID_CREDITS'
}

// Must be type 'info' | 'warn' | 'error'
const FAILURE_SEVERITIES = {
  [FAILURE_REASONS.MISSING_ENROLMENT]: 'info',
  [FAILURE_REASONS.DUPLICATE_COMPLETION]: 'info',
  [FAILURE_REASONS.STUDENT_NOT_FOUND]: 'error',
  [FAILURE_REASONS.NO_VALID_ATTAINMENT_DATE]: 'error',
  [FAILURE_REASONS.VERIFIER_NOT_FOUND]: 'error',
  [FAILURE_REASONS.INVALID_GRADE]: 'error',
  [FAILURE_REASONS.INVALID_CREDITS]: 'error'
}

// Counts per reason code, e.g. ['29x INVALID_GRADE', '2x STUDENT_NOT_FOUND']
const summarizeReasons = (failed) =>
  Object.entries(failed.reduce((acc, { reason }) => ({ ...acc, [reason]: (acc[reason] || 0) + 1 }), {})).map(
    ([reason, amount]) => `${amount}x ${reason}`
  )

const failureMessage = ({ studentNumber, message }) => `Completion failed for ${studentNumber}: ${message}`

// Unknown reasons are treated as errors
const severityOf = ({ reason }) => FAILURE_SEVERITIES[reason] || 'error'

module.exports = { FAILURE_REASONS, FAILURE_SEVERITIES, severityOf, summarizeReasons, failureMessage }
