import App from '@client/components/App'
import ErrorBoundary from '@client/components/ErrorBoundary'
import theme from '@client/theme'
import { setHeaders } from '@client/utils/fakeShibboleth'
import store from '@client/utils/store'
import { CssBaseline } from '@mui/material'

import '@client/assets/custom.css'
import { ThemeProvider } from '@mui/material/styles'
import * as Sentry from '@sentry/react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

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

const root = createRoot(document.getElementById('root'))

const render = () =>
  root.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  )

// Tint the background in dev so a local tab is never mistaken for production.
if (process.env.NODE_ENV === 'development') document.body.classList.add('dev-env')

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

render()
