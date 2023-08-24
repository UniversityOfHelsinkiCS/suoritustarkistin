import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import 'Assets/custom.css'
import { setHeaders } from 'Utilities/fakeShibboleth'
import * as Sentry from '@sentry/react'

import store from 'Utilities/store'
import App from 'Components/App'
import ErrorBoundary from 'Components/ErrorBoundary'

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')
  Sentry.init({
    dsn: 'https://6fb694554ea5cfb9c82fb2d7d2a8bc5f@toska.cs.helsinki.fi/16',
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    normalizeDepth: 10
  })

const refresh = () =>
  render(
    <Provider store={store}>
      <BrowserRouter basename={__BASE_PATH__}>
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

if (module.hot) {
  module.hot.accept()
}
