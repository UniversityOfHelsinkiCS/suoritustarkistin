import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Grid, Icon } from 'semantic-ui-react'
import { deleteCourseAction } from 'Utilities/redux/coursesReducer'
import EditCourse from 'Components/CoursesPage/EditCourse'

export default ({ course, graders }) => {
  const dispatch = useDispatch()
  const [really, setReally] = useState(false)

  const DeleteButton = () => (
    <Button
      onClick={() => {
        setReally(true)
      }}
      content="Delete"
      negative
    />
  )

  const getGradersNames = () => {
    if (!graders || !course.graders) return null
    const courseGraders = course.graders.map((grader) => grader.name)
    return courseGraders ? courseGraders.join(', ') : null
  }

  const Confirm = () => (
    <Button.Group>
      <Button
        onClick={() => {
          setReally(false)
        }}
        content="Cancel"
      />
      <Button
        onClick={() => dispatch(deleteCourseAction(course.id))}
        content="Really delete"
        positive
      />
    </Button.Group>
  )
  return (
    <Grid.Row>
      <Grid.Column width={3}>{course.name}</Grid.Column>
      <Grid.Column width={2}>{course.courseCode}</Grid.Column>
      <Grid.Column width={1}>{course.language}</Grid.Column>
      <Grid.Column width={1}>{course.credits}</Grid.Column>
      <Grid.Column width={3}>{getGradersNames()}</Grid.Column>
      <Grid.Column textAlign="center" width={2}>
        {course.isMooc ? (
          <Icon name="check" color="green" size="large" />
        ) : null}
      </Grid.Column>
      <Grid.Column textAlign="center" width={2}>
        {course.autoSeparate ? (
          <Icon name="check" color="green" size="large" />
        ) : null}
      </Grid.Column>
      <Grid.Column width={2}>
        <EditCourse course={course} />
        {really ? <Confirm /> : <DeleteButton />}
      </Grid.Column>
    </Grid.Row>
  )
}
