import SisReports from '@client/components/ReportsPage/SisReports'
import { Alert, AlertTitle } from '@mui/material'
import React from 'react'

const UnsentEntries = () => (
  <>
    <Alert severity="info" sx={{ maxWidth: 800, marginLeft: '14px', marginTop: '12px' }}>
      <AlertTitle>What are unsent entries?</AlertTitle>
      Here are listed the batches with completions that have not been sent to Sisu, even though everything needed for
      sending them is in place. Completions still missing an enrollment are not listed here, they are in the enrolment
      limbo tab. Toska is emailed about these once a week.
    </Alert>
    <SisReports unsent />
  </>
)

export default UnsentEntries
