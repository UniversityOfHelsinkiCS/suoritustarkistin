import React from 'react'
import { useSelector } from 'react-redux'
import * as _ from 'lodash'
import { Grid, Header, Segment } from 'semantic-ui-react'

import User from 'Components/UsersPage/User'

export default () => {
  const users = useSelector((state) => state.users.data)

  if (!users) return null

  return (
    <Segment>
      <Grid celled="internally" style={{wordWrap: 'anywhere'}}>
        <Grid.Row>
          <Grid.Column width={8}>
            <Header as="h4">Name</Header>
          </Grid.Column>
          <Grid.Column textAlign="center" width={1}>
            <Header as="h4">Grader</Header>
          </Grid.Column>
          <Grid.Column textAlign="center" width={1}>
            <Header as="h4">Admin</Header>
          </Grid.Column>
          <Grid.Column textAlign="center" width={2}>
            <Header as="h4">Last login</Header>
          </Grid.Column>
          <Grid.Column textAlign="center" width={3}>
            <Header as="h4">Edit</Header>
          </Grid.Column>
          <Grid.Column width={1} />
        </Grid.Row>
        {_.sortBy(users, 'name').map((u) => (
          <User user={u} key={u.id} />
        ))}
      </Grid>
    </Segment>
  )
}
