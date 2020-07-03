import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import 'Assets/custom.css'
import { setHeaders } from 'Utilities/fakeShibboleth'

import store from 'Utilities/store'
import App from 'Components/App'

const refresh = () =>
  render(
    <Provider store={store}>
      <BrowserRouter basename={__BASE_PATH__}>
        <App />
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  )

if (process.env.NODE_ENV === 'development') {
  const newUser = 'admin'
  const currentFakeUser = window.localStorage.getItem('fakeUser')
  if (currentFakeUser) {
    const parsedFakeCurrentUser = JSON.parse(currentFakeUser)

    if (
      parsedFakeCurrentUser.employeeId !== 'cypressUser' &&
      parsedFakeCurrentUser.employeeId !== 'cypressAdminUser'
    ) {
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
