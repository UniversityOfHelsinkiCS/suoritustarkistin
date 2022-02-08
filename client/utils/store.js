import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import * as Sentry from "@sentry/react"

import { inProduction } from 'Utilities/common'
import { handleRequest } from 'Utilities/apiConnection'
import combinedReducers from 'Utilities/redux'

const sentryReduxEnhancer = Sentry.createReduxEnhancer({})

// eslint-disable-next-line
const composeEnhancers = (!inProduction && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(
  combinedReducers,
  composeEnhancers(applyMiddleware(thunk, handleRequest), sentryReduxEnhancer),
)

export default store
