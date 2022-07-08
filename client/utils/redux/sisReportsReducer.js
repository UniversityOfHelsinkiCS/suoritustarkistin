/* eslint-disable no-param-reassign */
import callBuilder from '../apiConnection'

const _ = require('lodash')
/**
 * Actions and reducers are in the same file for readability
 */

const stringify = (params) => {
  const query = new URLSearchParams(params)
  return query.toString()
}

export const getAllSisReportsAction = ({ offset = 0, limit, filters }) => {
  if (!filters) filters = { adminmode: window.localStorage.getItem('adminmode') || false }
  const route = `/sis_reports?${stringify({ offset, limit, ...filters })}`
  const prefix = 'GET_ALL_SIS_REPORTS'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getAllMoocSisReportsAction = ({ offset = 0, limit, filters }) => {
  if (!filters) filters = { adminmode: window.localStorage.getItem('adminmode') || false }
  const route = `/sis_mooc_reports?${stringify({ offset, limit, ...filters })}`
  const prefix = 'GET_ALL_MOOC_SIS_REPORTS'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getAllEnrollmentLimboEntriesAction = ({ offset = 0, limit }) => {
  const route = `/enrollment_limbo?${stringify({ offset, limit })}`
  const prefix = 'GET_ALL_ENROLLMENT_LIMBO'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getOffsetForBatchAction = (batchId) => {
  const route = `/sis_reports/offset/${batchId}`
  const prefix = 'GET_OFFSET'
  return callBuilder(route, prefix, 'get')
}

export const getUnsentBatchCountAction = () => {
  const route = '/unsent_batch_count'
  const prefix = 'GET_UNSENT_BATCH_COUNT'
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

export const sendEntriesToSisAction = (entryIds, extraEntryIds) => {
  const route = `/entries_to_sis`
  const prefix = 'POST_ENTRIES_TO_SIS'
  return callBuilder(route, prefix, 'post', { entryIds, extraEntryIds })
}

export const refreshBatchStatus = (data) => {
  const route = `/refresh_sis_status`
  const prefix = 'REFRESH_BATCH_STATUS'
  return callBuilder(route, prefix, 'post', data)
}

export const refreshEnrollmentsAction = (rawEntryIds) => {
  const route = `/refresh_sis_enrollments`
  const prefix = 'REFRESH_ENROLLMENTS'
  return callBuilder(route, prefix, 'post', rawEntryIds)
}

export const sendMissingEnrollmentEmail = (batchId) => {
  const route = `/sis_reports/missing_enrollment_email/${batchId}`
  const prefix = 'SEND_MISSING_ENROLLMENT_EMAIL'
  return callBuilder(route, prefix, 'get', batchId)
}

export const openReport = (id) => ({
  type: 'OPEN_REPORT',
  id
})

export const toggleFilterAction = (name) => ({
  type: 'TOGGLE_FILTER',
  name
})

export const setFilterAction = (name, value) => ({
  type: 'SET_FILTER',
  name,
  value
})

export const resetFiltersAction = () => ({
  type: 'RESET_FILTERS'
})

const setOpenAccordions = (openAccordions, id) => {
  if (!openAccordions.includes(id)) {
    return [...openAccordions, id]
  }
  return openAccordions.filter((a) => a !== id)
}

const INITIAL_DATA = {
  rows: [],
  offset: 0,
  reportsFetched: false // HACK
}

const INITIAL_STATE = {
  reports: INITIAL_DATA,
  moocReports: INITIAL_DATA,
  enrolmentLimbo: INITIAL_DATA,
  unsentBatchCount: 0,
  openAccordions: [],
  pending: false,
  error: false,
  filters: {
    errors: false,
    noEnrollment: false,
    student: '',
    course: '',
    adminmode: window.localStorage.getItem('adminmode') || false,
    status: null,
    notSent: false
  }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = _.cloneDeep(INITIAL_STATE), action) => {
  switch (action.type) {
    case 'GET_ALL_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        reports: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_ALL_MOOC_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        moocReports: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_ALL_ENROLLMENT_LIMBO_SUCCESS':
      return {
        ...state,
        enrolmentLimbo: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_UNSENT_BATCH_COUNT_SUCCESS':
      return {
        ...state,
        unsentBatchCount: Number(action.response.count),
        pending: false,
        error: false
      }
    case 'GET_ALL_SIS_REPORTS_ATTEMPT':
    case 'GET_ALL_MOOC_SIS_REPORTS_ATTEMPT':
    case 'GET_ALL_ENROLLMENT_LIMBO_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_UNSENT_BATCH_COUNT_ATTEMPT':
    case 'GET_ALL_SIS_REPORTS_FAILURE':
    case 'GET_ALL_MOOC_SIS_REPORTS_FAILURE':
    case 'GET_ALL_ENROLLMENT_LIMBO_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'GET_UNSENT_BATCH_COUNT_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'DELETE_SINGLE_ENTRY_SUCCESS': {
      const { openAccordions } = state
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions,
        pending: false,
        singleBatchPending: false,
        error: false
      }
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
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions: [],
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
        pending: true,
        error: false
      }
    case 'POST_ENTRIES_TO_SIS_FAILURE': {
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions: state.openAccordions,
        pending: false,
        singleBatchPending: false,
        error: action.error
      }
    }
    case 'POST_ENTRIES_TO_SIS_SUCCESS': {
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions: state.openAccordions,
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
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions: state.openAccordions,
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
        enrolmentLimbo: { ...INITIAL_DATA },
        pending: false,
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
        reports: { ...state.reports, reportsFetched: false, pending: false }
      }
    case 'GET_OFFSET_SUCCESS': {
      const key = action.response.mooc ? 'moocReports' : 'reports'
      const { offset, mooc } = action.response
      return {
        ...state,
        [key]: { ...state[key], offset },
        allowFetch: true,
        mooc
      }
    }
    case 'SET_FILTER': {
      const { name, value } = action
      return {
        ...state,
        filters: {
          ...state.filters,
          [name]: value
        }
      }
    }
    case 'TOGGLE_FILTER': {
      const { name } = action
      const value = state.filters[name]
      return {
        ...state,
        filters: {
          ...state.filters,
          [name]: !value
        }
      }
    }
    case 'RESET_FILTERS': {
      const { filters } = INITIAL_STATE
      filters.adminmode = window.localStorage.getItem('adminmode')
      return {
        ...state,
        filters
      }
    }
    default:
      return state
  }
}
