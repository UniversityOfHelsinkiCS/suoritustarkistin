import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllReportsAction } from 'Utilities/redux/reportsReducer'
import { Segment } from 'semantic-ui-react'

const Downloaded = () => <div style={{ color: 'green' }}>DOWNLOADED</div>
const NotDownloaded = () => <div style={{ color: 'red' }}>NOT DOWNLOADED</div>

const reportLines = (report) => {
  return report.data
    .split('\n')
    .map((line, index) => <div key={`${report.id}-${index}`}>{line}</div>)
}

export default () => {
  const dispatch = useDispatch()
  const reports = useSelector((state) => state.reports)

  useEffect(() => {
    dispatch(getAllReportsAction())
  }, [])

  if (reports.pending) return <div>LOADING!</div>

  const manualReports = reports.data.filter((report) => report.reporterId) // filter out EoAI reports.

  if (manualReports.length === 0) return <div>NO REPORTS FOUND.</div>

  return (
    <>
      {manualReports.map((report) => {
        return (
          <Segment key={report.id}>
            <div>
              {report.fileName}{' '}
              {report.lastDownloaded ? <Downloaded /> : <NotDownloaded />}
            </div>
            {reportLines(report)}
          </Segment>
        )
      })}
    </>
  )
}
