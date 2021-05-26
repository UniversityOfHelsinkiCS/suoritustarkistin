const Sentry = require('@sentry/node')

const sendSentryMessage = (title, user, extras) => Sentry.withScope((scope) => {
  if (user)
    scope.setUser(user.get ? user.get({ plain: true }) : user)
  if (extras)
    scope.setExtras({ ...extras })
  Sentry.captureMessage(title)
})

module.exports = { sendSentryMessage }
