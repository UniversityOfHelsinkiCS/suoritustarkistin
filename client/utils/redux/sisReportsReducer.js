import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllSisReportsAction = () => {
  const route = '/sis_reports'
  const prefix = 'GET_ALL_SIS_REPORTS'
  return callBuilder(route, prefix, 'get')
}

export const getUsersSisReportsAction = (id) => {
  const route = `/users/${id}/sis_reports`
  const prefix = 'GET_USERS_SIS_REPORTS'
  return callBuilder(route, prefix, 'get')
}

export const handleEntryDeletionAction = (id) => {
  const route = `/sis_reports/${id}`
  const prefix = 'DELETE_SINGLE_ENTRY'
  return callBuilder(route, prefix, 'delete')
}

export const handleBatchDeletionAction = (batchId) => {
  const route = `/sis_reports/batch/${batchId}`
  const prefix = 'DELETE_BATCH'
  return callBuilder(route, prefix, 'delete')
}

export const sendEntriesToSisAction = (entryIds) => {
  const route = `/entries_to_sis`
  const prefix = 'POST_ENTRIES_TO_SIS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshBatchStatus = (entryIds) => {
  const route = `/refresh_sis_status`
  const prefix = 'REFRESH_BATCH_STATUS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshEnrollmentsAction = (rawEntryIds) => {
  const route = `/refresh_enrollments`
  const prefix = 'REFRESH_ENROLLMENTS'
  return callBuilder(route, prefix, 'post', rawEntryIds)
}

export const openReport = (id) => ({
  type: 'OPEN_REPORT',
  id
})

const setOpenAccordions = (openAccordions, id) => {
  if (!openAccordions.includes(id)) {
    return [...openAccordions, id]
  }
  return openAccordions.filter((a) => a !== id)
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [], openAccordions: [] }, action) => {
  switch (action.type) {
    case 'GET_ALL_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false,
        reportsFetched: true
      }
    case 'GET_ALL_SIS_REPORTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_SIS_REPORTS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'GET_USERS_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false,
        reportsFetched: true
      }
    case 'GET_USERS_SIS_REPORTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_USERS_SIS_REPORTS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'DELETE_SINGLE_ENTRY_SUCCESS':
      return {
        ...state,
        data: state.data.filter((e) => e.id != action.response.id),
        pending: false,
        singleBatchPending: false,
        error: false
      }
    case 'DELETE_SINGLE_ENTRY_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'DELETE_SINGLE_ENTRY_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'DELETE_BATCH_SUCCESS':
      return {
        ...state,
        openAccordions: [],
        data: state.data.filter((e) => e.batchId != action.response.batchId),
        pending: false,
        error: false
      }
    case 'DELETE_BATCH_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'DELETE_BATCH_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'POST_ENTRIES_TO_SIS_ATTEMPT':
      return {
        ...state,
        singleBatchPending: true,
        pending: false,
        error: false
      }
    case 'POST_ENTRIES_TO_SIS_FAILURE': {
      const { error } = action
      // When generic error occurs, no need to update entries in state
      if (error.genericError)
        return { ...state, pending: false, error: true }
      const updatedIds = error.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = error.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    }
    case 'POST_ENTRIES_TO_SIS_SUCCESS': {
      const updatedIds = action.response.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = action.response.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'REFRESH_BATCH_STATUS_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'REFRESH_BATCH_STATUS_SUCCESS': {
      const updatedIds = action.response.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = action.response.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'REFRESH_BATCH_STATUS_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'REFRESH_ENROLLMENTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        refreshSuccess: false,
        error: false
      }
    case 'REFRESH_ENROLLMENTS_SUCCESS':
      return {
        ...state,
        pending: false,
        refreshSuccess: true,
        error: false
      }
    case 'REFRESH_ENROLLMENTS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'OPEN_REPORT':
      return {
        ...state,
        openAccordions: setOpenAccordions(state.openAccordions, action.id)
      }
    case 'POST_RAW_ENTRIES_SUCCESS':
      return {
        ...state,
        reportsFetched: false
      }
    default:
      return state
  }
}
