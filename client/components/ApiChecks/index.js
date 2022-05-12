import React from 'react'
import { useSelector } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import { Loader } from 'semantic-ui-react'

import EduwebCheck from 'Components/ApiChecks/EduwebCheck'
import MoocCheck from 'Components/ApiChecks/MoocCheck'
import Message from 'Components/Message'

export default () => {
  const { pending } = useSelector((state) => state.apiChecks)

  return (
    <>
      <Message />
      <Loader size="big" active={pending} />
      <Grid>
        <Grid.Column width={8}>
          <EduwebCheck />
        </Grid.Column>
        <Grid.Column width={8}>
          <MoocCheck />
        </Grid.Column>
      </Grid>
    </>
  )
}
