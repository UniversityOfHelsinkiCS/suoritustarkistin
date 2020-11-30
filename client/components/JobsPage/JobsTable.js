import React from 'react'
import JobRow from 'Components/JobsPage/JobRow'
import { useSelector } from 'react-redux'
import { Grid, Header, Segment } from 'semantic-ui-react'

export default () => {
  const jobs = useSelector((state) => state.jobs.data)

  return (
    <Segment>
      <Grid celled="internally">
        <Grid.Row>
          <Grid.Column width={2}>
            <Header as="h4">Schedule</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Course code</Header>
          </Grid.Column>
          <Grid.Column width={3}>
            <Header as="h4">Course name</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Grader</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Slug</Header>
          </Grid.Column>
          <Grid.Column width={1}>
            <Header as="h4">Active</Header>
          </Grid.Column>
          <Grid.Column width={4}>
            <Header as="h4">Actions</Header>
          </Grid.Column>
        </Grid.Row>
        {jobs.map((j) => (
          <JobRow job={j} key={j.id} />
        ))}
      </Grid>
    </Segment>
  )
}
