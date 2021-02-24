import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Header, Grid, Loader, Segment } from 'semantic-ui-react'
import moment from 'moment'

import { addKurkiRawEntriesAction } from 'Utilities/redux/kurkiReducer'

const CourseTable = () => {
  const dispatch = useDispatch()
  const kurki = useSelector((state) => state.kurki)

  if (!kurki || !kurki.courses) return null

  const createReport = (course) => {
    const newCourse = {
      kurkiId: course.id,
      name: course.name,
      credits: course.credits,
      language: course.language,
      graderUid: course.ownerId 
    }
    dispatch(addKurkiRawEntriesAction(newCourse))
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
            <Grid.Column width={2}>{moment(course.startDate).format("DD.MM.YYYY")}</Grid.Column>
            <Grid.Column width={3}>
              <Button
                color="blue"
                onClick={() => createReport(course)}
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