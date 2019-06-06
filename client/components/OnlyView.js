import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'

import Dropzone from 'components/Dropzone'

export default () => {
  const [reportData, setReportData] = useState('')

  return (
    <div>
      <br />
      <Dropzone setReportData={setReportData} />
      <p>{reportData}</p>
    </div>
  )
}
