import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Grid, Icon } from 'semantic-ui-react'
import { deleteJobAction } from 'Utilities/redux/jobsReducer'
import EditCourse from 'Components/CoursesPage/EditCourse'

export default ({ job }) => {
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

  const Confirm = () => (
    <Button.Group>
      <Button
        onClick={() => {
          setReally(false)
        }}
        content="Cancel"
      />
      <Button
        onClick={() => dispatch(deleteJobAction(job.id))}
        content="Really delete"
        positive
      />
    </Button.Group>
  )
  return (
    <Grid.Row>
      <Grid.Column width={3}>{job.schedule}</Grid.Column>
      <Grid.Column width={2}>{job.courseId}</Grid.Column>
      <Grid.Column width={4}>{job.courseId}</Grid.Column>
      <Grid.Column width={4}>{job.graderId}</Grid.Column>
      <Grid.Column textAlign="center" width={1}>
        {job.active ? <Icon name="check" color="green" size="large" /> : null}
      </Grid.Column>
      <Grid.Column width={4}>
        <EditCourse course={job} />
        {really ? <Confirm /> : <DeleteButton />}
      </Grid.Column>
    </Grid.Row>
  )
}
