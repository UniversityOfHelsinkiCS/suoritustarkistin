import axios from 'axios'
import { getHeaders } from 'Utilities/fakeShibboleth'
import { inProduction } from 'Utilities/common'

/**
 * ApiConnection simplifies redux usage
 */

const getAxios = axios.create({ baseURL: `${__BASE_PATH__}api` })

const callApi = async (url, method = 'get', data) => {
  const defaultHeaders = !inProduction ? getHeaders() : {}
  const headers = { ...defaultHeaders }

  const adminLoggedInAs = localStorage.getItem('adminLoggedInAs') // employeenumber
  if (adminLoggedInAs) headers['x-admin-logged-in-as'] = adminLoggedInAs

  return getAxios({
    method,
    url,
    data,
    headers
  })
}

export default (route, prefix, method = 'get', data, query) => ({
  type: `${prefix}_ATTEMPT`,
  requestSettings: {
    route,
    method,
    data,
    prefix,
    query
  }
})

/**
 * This is a redux middleware used for tracking api calls
 */

export const handleRequest = (store) => (next) => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const { route, method, data, prefix, query } = requestSettings
    try {
      const res = await callApi(route, method, data)
      store.dispatch({ type: `${prefix}_SUCCESS`, response: res.data, query })
    } catch (err) {
      // Reload page on stale Shibboleth session

      if (err.message.toLowerCase() === 'network error') {
        window.location.reload(true)
        return
      }

      // errorCode can be used to show the user what actually went wrong

      const errorCode = err.response && err.response.data && err.response.data.errorCode
      const error = err.response.data ? err.response.data.error : {}
      store.dispatch({ type: `${prefix}_FAILURE`, response: err, query, errorCode, error })
    }
  }
}
