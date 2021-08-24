import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Grid, Icon } from 'semantic-ui-react'

import { confirmDeletionAction } from 'Utilities/redux/coursesReducer'
import EditCourse from 'Components/CoursesPage/EditCourse'
import DeletionModal from 'Components/CoursesPage/DeletionModal'


export default ({ course, graders }) => {
  const [showForm, setShowForm] = useState(false)
  const dispatch = useDispatch()
  const getGradersNames = () => {
    if (!graders || !course.graders) return null
    const courseGraders = course.graders.map((grader) => grader.name)
    return courseGraders ? courseGraders.join(', ') : null
  }
 
  const confirmDeletion = async (id) => {
    await dispatch(confirmDeletionAction(id))
    setShowForm(true)
  }

  return (
    <Grid.Row>
      <Grid.Column width={3}>{course.name}</Grid.Column>
      <Grid.Column width={2}>{course.courseCode}</Grid.Column>
      <Grid.Column width={1}>{course.language}</Grid.Column>
      <Grid.Column width={1}>{course.credits}</Grid.Column>
      <Grid.Column width={3}>{getGradersNames()}</Grid.Column>
      <Grid.Column width={2}>{course.gradeScale}</Grid.Column>
      <Grid.Column textAlign="center" width={2}>
        {course.autoSeparate ? (
          <Icon name="check" color="green" size="large" />
        ) : null}
      </Grid.Column>
      <Grid.Column width={2}>
        <EditCourse course={course} />
        <Button
          color="red"
          data-cy="delete-course-button"
          onClick={() => confirmDeletion(course.id)}
          content="Delete"
        />
        {showForm && <DeletionModal id={course.id} showForm={showForm} setShowForm={setShowForm} />}
      </Grid.Column>
    </Grid.Row>
  )
}
