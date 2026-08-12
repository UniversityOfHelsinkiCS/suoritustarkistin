import React from 'react'
import { Message } from 'semantic-ui-react'

import SisReports from '@client/components/ReportsPage/SisReports'

const UnsentEntries = () => (
  <>
    <Message style={{ maxWidth: 800, marginLeft: 14, marginTop: 12 }} info>
      <Message.Header>What are unsent entries?</Message.Header>
      <Message.Content>
        Here are listed the batches with completions that have not been sent to Sisu, even though everything needed for
        sending them is in place. Completions still missing an enrollment are not listed here, they are in the enrolment
        limbo tab. Toska is emailed about these once a week.
      </Message.Content>
    </Message>
    <SisReports unsent />
  </>
)

export default UnsentEntries
