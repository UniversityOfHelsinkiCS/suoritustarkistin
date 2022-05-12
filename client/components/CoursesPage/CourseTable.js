import React from 'react'
import { useSelector } from 'react-redux'
import { Grid, Header, Segment } from 'semantic-ui-react'
import * as _ from 'lodash'

import CourseRow from 'Components/CoursesPage/CourseRow'

export default () => {
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)

  if (!courses) return null

  return (
    <Segment>
      <Grid celled="internally" style={{ wordWrap: 'anywhere' }}>
        <Grid.Row>
          <Grid.Column width={3}>
            <Header as="h4">Name</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Course code</Header>
          </Grid.Column>
          <Grid.Column width={1}>
            <Header as="h4">Language</Header>
          </Grid.Column>
          <Grid.Column width={1}>
            <Header as="h4">Credit amount</Header>
          </Grid.Column>
          <Grid.Column width={3}>
            <Header as="h4">Graders</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Grade scale</Header>
          </Grid.Column>
          <Grid.Column width={1}>
            <Header as="h4">Extra completions</Header>
          </Grid.Column>
          <Grid.Column width={2} />
        </Grid.Row>
        {_.sortBy(courses, 'name').map((c) => (
          <CourseRow course={c} graders={graders} key={c.id} />
        ))}
      </Grid>
    </Segment>
  )
}
