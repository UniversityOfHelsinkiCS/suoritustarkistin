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

const expandField = (field, spec) => {
  const values = new Set()
  field.split(',').forEach((item) => {
    const [range, step] = item.split('/')
    const stepSize = step === undefined ? 1 : Number(step)
    const [from, to] =
      range === '*'
        ? [spec.min, spec.max]
        : (() => {
            const bounds = range.split('-').map((bound) => parseValue(bound, spec))
            return bounds.length === 2 ? bounds : [bounds[0], step === undefined ? bounds[0] : spec.max]
          })()
    for (let value = from; value <= to; value += stepSize) values.add(value)
  })
  return values
}

const REFERENCE_YEAR = 2024

const scheduleRuns = (expression) => {
  const fields = expression.trim().split(/\s+/)
  const specs = fields.length === 5 ? CRON_FIELDS.slice(1) : CRON_FIELDS
  const sets = fields.map((field, index) => expandField(field, specs[index]))
  const [seconds, minutes, hours, daysOfMonth, months, daysOfWeek] =
    fields.length === 5 ? [new Set([0]), ...sets] : sets

  const times = []
  ;[...hours].forEach((hour) =>
    [...minutes].forEach((minute) => [...seconds].forEach((second) => times.push((hour * 60 + minute) * 60 + second)))
  )
  times.sort((a, b) => a - b)

  const domRestricted = !fields[fields.length - 3].includes('*')
  const dowRestricted = !fields[fields.length - 1].includes('*')
  const days = new Set()
  const date = new Date(Date.UTC(REFERENCE_YEAR, 0, 1))
  for (let day = 0; date.getUTCFullYear() === REFERENCE_YEAR; day += 1) {
    const matchesDom = daysOfMonth.has(date.getUTCDate())
    const matchesDow = daysOfWeek.has(date.getUTCDay()) || (date.getUTCDay() === 0 && daysOfWeek.has(7))
    const matchesDay = domRestricted && dowRestricted ? matchesDom || matchesDow : matchesDom && matchesDow
    if (matchesDay && months.has(date.getUTCMonth() + 1)) days.add(day)
    date.setUTCDate(date.getUTCDate() + 1)
  }

  return { days, times }
}

const DAY = 24 * 60 * 60

const minTimeGap = (times, others, shift) => {
  let gap = Infinity
  let index = 0
  times.forEach((time) => {
    while (index < others.length - 1 && others[index] + shift < time) index += 1
    gap = Math.min(gap, Math.abs(time - (others[index] + shift)))
    if (index > 0) gap = Math.min(gap, Math.abs(time - (others[index - 1] + shift)))
  })
  return gap
}

/**
 * Smallest gap in seconds between any two runs of the given expressions,
 * or null if either expression is invalid.
 */
export const scheduleGap = (expression, otherExpression) => {
  if (!validate(expression) || !validate(otherExpression)) return null

  const a = scheduleRuns(expression)
  const b = scheduleRuns(otherExpression)

  let sameDay = false
  let adjacentDay = false
  a.days.forEach((day) => {
    if (b.days.has(day)) sameDay = true
    if (b.days.has(day - 1) || b.days.has(day + 1)) adjacentDay = true
  })

  let gap = Infinity
  if (sameDay) gap = minTimeGap(a.times, b.times, 0)
  if (adjacentDay) {
    gap = Math.min(gap, minTimeGap(a.times, b.times, -DAY), minTimeGap(a.times, b.times, DAY))
  }

  return gap
}

/** Times of day in seconds at which the given expression runs, or null if it is invalid. */
export const runTimes = (expression) => (validate(expression) ? scheduleRuns(expression).times : null)

/**
 * First whole minute of the day that is at least minGap seconds away from every
 * given time of day, counting across midnight. Null if the day has no such minute.
 */
export const firstFreeMinute = (times, minGap) => {
  for (let minute = 0; minute < 24 * 60; minute += 1) {
    const time = minute * 60
    const clear = times.every((other) => {
      const distance = Math.abs(time - other)
      return Math.min(distance, DAY - distance) >= minGap
    })
    if (clear) return time
  }
  return null
}
