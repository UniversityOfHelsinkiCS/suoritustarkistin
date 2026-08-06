import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import '@client/assets/custom.css'
import { setHeaders } from '@client/utils/fakeShibboleth'
import * as Sentry from '@sentry/react'

import store from '@client/utils/store'
import App from '@client/components/App'
import ErrorBoundary from '@client/components/ErrorBoundary'

/**
 * The frontend reports to its own Sentry project, separate from the backend's, so a
 * student's browser crash and a cron failure are not in the same inbox. A DSN is
 * write-only and ships in the bundle regardless, so there is nothing to hide here.
 *
 * VITE_E2E is the explicit opt-out: the e2e image builds this bundle with
 * NODE_ENV=production (config/test.Dockerfile), so the environment check alone would
 * not tell a test run apart from the real thing.
 */
if (process.env.NODE_ENV === 'production' && !import.meta.env.VITE_E2E)
  Sentry.init({
    dsn: 'https://66080a276256201f8713622742a935f2@toska.it.helsinki.fi/33',
    environment: process.env.NODE_ENV,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    normalizeDepth: 10
  })

const refresh = () =>
  render(
    <Provider store={store}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  )

if (process.env.NODE_ENV === 'development' && !window.localStorage.getItem('runningCypressTests')) {
  const newUser = 'admin'
  const currentFakeUser = window.localStorage.getItem('fakeUser')
  if (currentFakeUser) {
    const parsedFakeCurrentUser = JSON.parse(currentFakeUser)

    if (parsedFakeCurrentUser.employeeId !== 'cypressUser' && parsedFakeCurrentUser.employeeId !== 'cypressAdminUser') {
      setHeaders(newUser)
    }
  } else {
    setHeaders(newUser)
  }
}

refresh()
