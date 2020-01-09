import React from 'react'
import { Segment } from 'semantic-ui-react'

const Downloaded = () => (
  <div data-cy="report-downloaded" style={{ color: 'green' }}>
    DOWNLOADED
  </div>
)
const NotDownloaded = () => (
  <div data-cy="report-not-downloaded" style={{ color: 'red' }}>
    NOT DOWNLOADED
  </div>
)

const reportLines = (report) => {
  return report.data
    .split('\n')
    .map((line, index) => <div key={`${report.id}-${index}`}>{line}</div>)
}

export default ({ reports }) => {
  if (reports.pending) return <div>LOADING!</div>

  if (reports.data.length === 0) return <div>NO REPORTS FOUND.</div>

  return (
    <div data-cy="raw-reports">
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
    </div>
  )
}
