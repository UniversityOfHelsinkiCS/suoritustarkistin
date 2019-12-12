import React from 'react'
import Course from 'Components/CoursesPage/Course'
import { useSelector } from 'react-redux'
import { Grid, Header } from 'semantic-ui-react'

export default () => {
  const courses = useSelector((state) => state.courses.data)

  return (
    <Grid celled="internally">
      <Grid.Row>
        <Grid.Column width={3}>
          <Header as="h4">Name</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Course code</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Language</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Credit amount</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Grader name</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Email magic</Header>
        </Grid.Column>
        <Grid.Column>
          <Header as="h4">Combo course</Header>
        </Grid.Column>
        <Grid.Column />
      </Grid.Row>
      {courses.map((c) => (
        <Course course={c} key={c.id} />
      ))}
    </Grid>
  )
}
