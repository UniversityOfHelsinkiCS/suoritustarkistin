const Sentry = require('@sentry/node')
const logger = require('@server/utils/logger')

const withUserScope = (user, extras, capture) =>
  Sentry.withScope((scope) => {
    if (user) scope.setUser(user.get ? user.get({ plain: true }) : user)
    scope.setExtras(extras)
    capture()
  })

/**
 * For notable-but-expected events that carry no exception, e.g. a status report from a
 * cron run. Prefer sendSentryError whenever an Error object is in hand: a message loses
 * the stack, so everything it reports groups by its title alone.
 */
const sendSentryMessage = (title, { user, ...extras } = {}) =>
  withUserScope(user, extras, () => {
    Sentry.captureMessage(title)
    logger.info({ message: `Sentry: ${title}`, user, extras })
  })

/**
 * For genuine faults someone should act on. Reports the exception itself, so the stack
 * survives and Sentry groups by where it was actually thrown. The operation tag names
 * what was being attempted, for filtering — grouping stays with the stack.
 */
const sendSentryError = (title, error, { user, ...extras } = {}) =>
  withUserScope(user, extras, () => {
    if (error) Sentry.captureException(error, { tags: { operation: title } })
    else Sentry.captureMessage(title)
    logger.error({
      message: `Sentry: ${title}`,
      user,
      ...(error ? { error: error instanceof Error ? error.stack : String(error) } : {})
    })
  })

module.exports = { sendSentryMessage, sendSentryError }
