/**
 * Redacts sensitive data from Sentry events
 */
const REDACTED = '[redacted]'
const SECRET_SNIPPETS = ['auth', 'token', 'key', 'secret', 'cookie']

const isSecret = (name) => SECRET_SNIPPETS.some((snippet) => name.toLowerCase().includes(snippet))

const scrubSentryEvent = (event) => {
  const { headers, query_string: query } = event.request ?? {}

  if (headers) {
    for (const name of Object.keys(headers)) {
      if (isSecret(name)) headers[name] = REDACTED
    }
  }

  if (query) event.request.query_string = String(query).replace(/(token=)[^&]*/gi, `$1${REDACTED}`)

  return event
}

module.exports = { scrubSentryEvent, REDACTED }
