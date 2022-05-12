const Sentry = require('@sentry/node')
const logger = require('@utils/logger')

const sendSentryMessage = (title, user, extras) =>
  Sentry.withScope((scope) => {
    if (user) scope.setUser(user.get ? user.get({ plain: true }) : user)
    if (extras) scope.setExtras(JSON.stringify(extras))
    Sentry.captureMessage(title)
    logger.info({ message: `Sentry: ${title}`, user, extras })
  })

module.exports = { sendSentryMessage }
