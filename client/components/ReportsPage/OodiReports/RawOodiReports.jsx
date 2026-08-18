import React, { useEffect, useState } from 'react'
import Paper from '@mui/material/Paper'

import TabLoader from '@client/components/ReportsPage/TabLoader'

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

const reportLines = (report) =>
  report.data.split('\n').map((line, index) => <div key={`${report.id}-${index}`}>{line}</div>)

export default ({ reports }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (reports.pending || loading) return <TabLoader />
  if (reports.data.length === 0) return <div>NO REPORTS FOUND.</div>

  return (
    <div data-cy="raw-oodi-reports">
      {reports.data.map((report) => (
        <Paper variant="outlined" key={report.id} sx={{ p: 2, mb: 1 }}>
          <div>
            {report.fileName} {report.lastDownloaded ? <Downloaded /> : <NotDownloaded />}
          </div>
          {reportLines(report)}
        </Paper>
      ))}
    </div>
  )
}
