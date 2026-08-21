/**
 * Cron expression syntax, validated without node-cron so this module stays
 * importable from the browser.
 */

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
]

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Ordered as in a 6-field expression; a 5-field one drops the leading seconds field.
const CRON_FIELDS = [
  { min: 0, max: 59 },
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12, names: MONTH_NAMES, offset: 1 },
  { min: 0, max: 7, names: WEEKDAY_NAMES, offset: 0 }
]

const parseValue = (token, field) => {
  if (/^\d+$/.test(token)) return Number(token)
  if (!field.names) return NaN
  // node-cron accepts both full names and their three-letter prefixes, case-insensitively
  const name = token.toLowerCase()
  const index = field.names.findIndex((full) => full === name || full.slice(0, 3) === name)
  return index === -1 ? NaN : index + field.offset
}

const isValidItem = (item, field) => {
  const parts = item.split('/')
  if (parts.length > 2) return false
  const [range, step] = parts
  if (step !== undefined && !/^[1-9]\d*$/.test(step)) return false
  if (range === '*') return true

  const bounds = range.split('-')
  if (bounds.length > 2) return false
  const values = bounds.map((bound) => parseValue(bound, field))
  if (values.some((value) => Number.isNaN(value) || value < field.min || value > field.max)) return false
  if (values.length === 2 && values[0] > values[1]) return false
  return true
}

export const validate = (expression) => {
  if (typeof expression !== 'string') return false
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== 5 && fields.length !== 6) return false

  const specs = fields.length === 5 ? CRON_FIELDS.slice(1) : CRON_FIELDS
  return fields.every((field, index) =>
    field.split(',').every((item) => item !== '' && isValidItem(item, specs[index]))
  )
}

const earliestValue = (field, spec) =>
  Math.min(
    ...field.split(',').map((item) => {
      const [range] = item.split('/')
      return range === '*' ? spec.min : parseValue(range.split('-')[0], spec)
    })
  )

export const earliestRun = (expression) => {
  if (!validate(expression)) return null

  const fields = expression.trim().split(/\s+/)
  const specs = fields.length === 5 ? CRON_FIELDS.slice(1) : CRON_FIELDS
  const values = fields.map((field, index) => earliestValue(field, specs[index]))
  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = fields.length === 5 ? [0, ...values] : values

  const timeOfDay = (hour * 60 + minute) * 60 + second
  const dayOfPeriod = month * 1e4 + dayOfMonth * 1e2 + (dayOfWeek % 7)

  return timeOfDay * 1e6 + dayOfPeriod
}
