const Sentry = require('@sentry/node')
const logger = require('@server/utils/logger')

const MAX_BODY_LENGTH = 2000

const describeResponse = (error) => {
  if (!error?.isAxiosError) return {}

  const { config = {}, response } = error
  const url = [config.baseURL, config.url]
    .filter(Boolean)
    .join('/')
    .replace(/([^:])\/{2,}/g, '$1/')
  const request = `${config.method?.toUpperCase()} ${url}`
  if (!response) return { request }

  const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
  return {
    request,
    responseStatus: response.status,
    responseBody: body?.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH)}...` : body
  }
}

const withUserScope = (user, extras, capture) =>
  Sentry.withScope((scope) => {
    if (user) scope.setUser(user.get ? user.get({ plain: true }) : user)
    scope.setExtras(extras)
    capture()
  })

const sendSentryMessage = (title, { user, ...extras } = {}) =>
  withUserScope(user, extras, () => {
    Sentry.captureMessage(title)
    logger.info({ message: `Sentry: ${title}`, user, extras })
  })

const sendSentryError = (title, error, { user, ...extras } = {}) => {
  const response = describeResponse(error)
  return withUserScope(user, { ...response, ...extras }, () => {
    if (error) Sentry.captureException(error, { tags: { operation: title } })
    else Sentry.captureMessage(title)
    logger.error({
      message: `Sentry: ${title}`,
      user,
      ...response,
      ...(error ? { error: error instanceof Error ? error.stack : String(error) } : {})
    })
  })
}

module.exports = { sendSentryMessage, sendSentryError }
