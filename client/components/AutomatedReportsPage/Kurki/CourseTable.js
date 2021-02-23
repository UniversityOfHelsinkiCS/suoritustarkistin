import React from 'react'
import { useSelector } from 'react-redux'
import { Button, Header, Grid, Loader, Segment } from 'semantic-ui-react'

import { addKurkiRawEntries } from 'Utilities/redux/kurkiReducer'

const CourseTable = () => {
  const kurki = useSelector((state) => state.kurki)

  if (!kurki || !kurki.courses) return null

  console.log(kurki)
  const createReport = (id, graderId) => {
    console.log(id)
    // addKurkiRawEntries(id, graderId)
  }

  return (
    <Segment>
      <Loader size='big' active={kurki.pending} />
      <Grid celled="internally">
        <Grid.Row>
          <Grid.Column width={2}>
            <Header as="h4">Course code</Header>
          </Grid.Column>
          <Grid.Column width={5}>
            <Header as="h4">Course name</Header>
          </Grid.Column>
          <Grid.Column width={4}>
            <Header as="h4">Grader</Header>
          </Grid.Column>
          <Grid.Column width={2}>
            <Header as="h4">Start date</Header>
          </Grid.Column>
          <Grid.Column width={3} />
        </Grid.Row>
        {kurki.courses.map((course) => (
          <Grid.Row key={course.id}>
            <Grid.Column width={2}>{course.id.split(".")[0]}</Grid.Column>
            <Grid.Column width={5}>{course.name}</Grid.Column>
            <Grid.Column width={4}>{course.ownerId}</Grid.Column>
            <Grid.Column width={2}>{course.startDate}</Grid.Column>
            <Grid.Column width={3}>
              <Button
                color="blue"
                onClick={createReport(course.id, course.ownerId)}
              >
                Create a report
              </Button>
            </Grid.Column>
          </Grid.Row>
        ))}
        <Grid.Row>

        </Grid.Row>
      </Grid>
    </Segment>
  )
}

export default CourseTable