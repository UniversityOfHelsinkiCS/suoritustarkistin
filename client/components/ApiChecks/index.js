import React from 'react'
import { Grid } from 'semantic-ui-react'

import EduwebCheck from 'Components/ApiChecks/EduwebCheck'
import MoocCheck from 'Components/ApiChecks/MoocCheck'

export default () => {
  return (
    <Grid>
      <Grid.Column width={8}>
        <EduwebCheck />
      </Grid.Column>
      <Grid.Column width={8}>
        <MoocCheck />
      </Grid.Column>
    </Grid>
  )

}
