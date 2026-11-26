import { isValidCreditAmount, isWithinCreditRange } from '@shared/validators'

/**
 * The credits a report row ends up with: its own, else the report's Credits field (offered
 * for KOPA courses, and only for rows on the report's course), else the course default.
 */
export const effectiveCredits = (row, rawEntries, course) => {
  if (row.credits) return row.credits
  const onReportCourse = !row.course || row.course === rawEntries.defaultCourse
  if (onReportCourse && rawEntries.reportCredits) return rawEntries.reportCredits
  return course?.credits
}

export const isValidReportCredits = (rawEntries, course) =>
  !rawEntries.reportCredits ||
  (isValidCreditAmount(rawEntries.reportCredits) && isWithinCreditRange(course, rawEntries.reportCredits))
