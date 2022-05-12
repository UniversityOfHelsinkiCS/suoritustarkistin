const moment = require('moment')

import callBuilder from '../apiConnection'

const initialState = {
  rawData: '',
  data: null,
  courseId: null,
  date: moment().format('D.M.YYYY')
}

export const setNewEntriesAction = (entries) => {
  return { type: 'SET_NEW_ENTRIES', payload: entries }
}

export const sendNewEntriesAction = (entries) => {
  const route = `/sis_entries`
  const prefix = 'POST_ENTRIES'
  return callBuilder(route, prefix, 'post', {
    ...entries,
    rawData: undefined,
    sending: undefined
  })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_NEW_ENTRIES':
      return action.payload
    case 'POST_ENTRIES_ATTEMPT':
      return {
        ...state,
        sending: true
      }
    case 'POST_ENTRIES_SUCCESS':
      return {
        ...state,
        data: null,
        courseId: null,
        date: moment().format('D.M.YYYY'),
        sending: false,
        rawData: ''
      }
    case 'POST_ENTRIES_FAILURE':
      return {
        ...state,
        sending: false
      }
    default:
      return state
  }
}
