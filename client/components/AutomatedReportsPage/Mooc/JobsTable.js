import React from 'react'
import * as _ from 'lodash'
import JobRow from 'Components/AutomatedReportsPage/Mooc/JobRow'
import { useSelector } from 'react-redux'
import { Grid, Header, Loader, Segment } from 'semantic-ui-react'

export default () => {
  const jobs = useSelector((state) => state.moocJobs)

  if (!jobs || !jobs.data) return null

  return (
    <Segment>
      <Loader size='big' active={jobs.pending} />
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
        {_.sortBy(jobs.data, 'schedule').map((j) => (
          <JobRow job={j} jobs={jobs} key={j.id} />
        ))}
      </Grid>
    </Segment>
  )
}
