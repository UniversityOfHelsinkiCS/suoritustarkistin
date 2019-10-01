import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllReportsAction } from 'Utilities/redux/reportsReducer'
import { Segment } from 'semantic-ui-react'

const Downloaded = () => <div style={{color: 'green'}}>DOWNLOADED</div>
const NotDownloaded = () => <div style={{color: 'red'}}>NOT DOWNLOADED</div>

const reportLines = (report) => {
  return report.data.split('\n').map((line, index) => <div key={`${report.id}-${index}`}>{line}</div>)
}

export default () => {
  const dispatch = useDispatch()
  const reports = useSelector((state) => state.reports.data)
  
  useEffect(() => {
    dispatch(getAllReportsAction())
  }, [])

  if (!reports) return <div>LOADING!</div>

  return (
    <>
      {reports.map((report) => {
        if (report.fileName.substring(0,10) === 'AYTKT21018') return null // TEMPORARY FIX: FILTER EOAI REPORTS
        return (
        <Segment key={report.id}>
          <div>{report.fileName} {report.lastDownloaded ? <Downloaded /> : <NotDownloaded />}</div>
          {reportLines(report)}
        </Segment>)})}
    </>
  )
}
