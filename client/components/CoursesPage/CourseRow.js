import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Grid, Icon } from 'semantic-ui-react'
import { deleteCourseAction } from 'Utilities/redux/coursesReducer'
import EditCourse from 'Components/CoursesPage/EditCourse'

export default ({ course }) => {
  const dispatch = useDispatch()
  const [really, setReally] = useState(false)
  const graders = useSelector((state) => state.graders.data)

  const DeleteButton = () => (
    <Button
      onClick={() => {
        setReally(true)
      }}
      content="Delete"
      negative
    />
  )

  const getGraderName = () => {
    if (!graders) return null
    const grader = graders.find((g) => g.id === course.graderId)
    return grader ? grader.name : null
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
      <Grid.Column>{course.courseCode}</Grid.Column>
      <Grid.Column>{course.language}</Grid.Column>
      <Grid.Column>{course.credits}</Grid.Column>
      <Grid.Column>{getGraderName()}</Grid.Column>
      <Grid.Column textAlign="center">
        {course.isMooc ? (
          <Icon name="check" color="green" size="large" />
        ) : null}
      </Grid.Column>
      <Grid.Column textAlign="center">
        {course.autoSeparate ? (
          <Icon name="check" color="green" size="large" />
        ) : null}
      </Grid.Column>
      <Grid.Column width={3}>
        <EditCourse course={course} />
        {really ? <Confirm /> : <DeleteButton />}
      </Grid.Column>
    </Grid.Row>
  )
}
