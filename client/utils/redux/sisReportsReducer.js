import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const sisGetAllReportsAction = () => {
  const route = '/sisReports'
  const prefix = 'SIS_GET_ALL_REPORTS'
  return callBuilder(route, prefix, 'get')
}

const fakeData = '010000003##1#SISTEST#SIS:iin lähtevä kurssi#14.12.2020#0#2#106##321#2#H523#####5,0'

const fakeReport = [
  {
    id:1,
    fileName:"SISTEST%14.12.20-103241_MANUAL.dat",
    data:fakeData,
    lastDownloaded:null,
    graderId:25,
    reporterId:25,
    createdAt:"2020-12-12T09:12:05.356Z",
    updatedAt:"2020-12-12T09:12:05.356Z",
  }
]

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'SIS_GET_ALL_REPORTS_SUCCESS':
      return {
        ...state,
        data: fakeReport,
        pending: false,
        error: false
      }
    case 'SIS_GET_ALL_REPORTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_GET_ALL_REPORTS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    default:
      return state
  }
}
