import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getUsersReportsAction } from 'Utilities/redux/reportsReducer'
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
  const user = useSelector((state) => state.user.data)

  useEffect(() => {
    dispatch(getUsersReportsAction(user.id))
  }, [])

  if (reports.pending) return <div>LOADING!</div>

  if (reports.data.length === 0) return <div>NO REPORTS FOUND.</div>

  return (
    <>
      {reports.data.map((report) => {
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