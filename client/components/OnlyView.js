import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'

import Dropzone from 'Components/Dropzone'
import ReportDisplay from 'Components/ReportDisplay'

export default () => {
  const [reportData, setReportData] = useState('No report given.')

  return (
    <div>
      <br />
      <Dropzone setReportData={setReportData} />
      <ReportDisplay reportData={reportData} />
    </div>
  )
}
