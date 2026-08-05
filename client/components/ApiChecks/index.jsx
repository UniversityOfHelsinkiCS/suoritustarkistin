import React from 'react'
import { useSelector } from 'react-redux'
import { Grid, Loader } from 'semantic-ui-react'

import Message from '@client/components/Message'
import EduwebCheck from '@client/components/ApiChecks/EduwebCheck'
import MoocCheck from '@client/components/ApiChecks/MoocCheck'
import NewMoocCheck from './NewMoocCheck'
import SisuCheck from './SisuCheck'

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
        <Grid.Column width={8}>
          <NewMoocCheck />
        </Grid.Column>
        <Grid.Column width={8}>
          <SisuCheck />
        </Grid.Column>
      </Grid>
    </>
  )
}
