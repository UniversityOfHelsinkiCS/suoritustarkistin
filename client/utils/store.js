import { handleRequest } from '@client/utils/apiConnection'
import { inProduction } from '@client/utils/common'
import combinedReducers from '@client/utils/redux'
import * as Sentry from '@sentry/react'
import { applyMiddleware, compose, createStore } from 'redux'
import { thunk } from 'redux-thunk'

const sentryReduxEnhancer = Sentry.createReduxEnhancer({})

// oxlint-disable-next-line no-underscore-dangle
const composeEnhancers = (!inProduction && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose
const store = createStore(
  combinedReducers,
  composeEnhancers(applyMiddleware(thunk, handleRequest), sentryReduxEnhancer)
)

export default store
