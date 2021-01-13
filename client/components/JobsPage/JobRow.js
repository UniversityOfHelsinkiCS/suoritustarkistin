import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Grid, Icon } from 'semantic-ui-react'
import { deleteJobAction, runJobAction, sisRunJobAction } from 'Utilities/redux/jobsReducer'
import EditJob from 'Components/JobsPage/EditJob'

export default ({ job }) => {
  const dispatch = useDispatch()
  const [really, setReally] = useState(false)
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)

  const course = courses ? courses.find((c) => c.id === job.courseId) : null

  const getCourseName = () => {
    return course ? course.name : null
  }

  const getCourseCode = () => {
    return course ? course.courseCode : null
  }

  const getGraderName = () => {
    if (!graders) return null
    if (!course) return null
    const grader = graders.find((g) => g.id === course.graderId)
    return grader ? grader.name : null
  }

  const DeleteButton = () => (
    <Button
      onClick={() => {
        setReally(true)
      }}
      content="Delete"
      negative
    />
  )

  const RunButton = () => (
    <Button
      onClick={() => dispatch(runJobAction(job.id))}
      content="Run"
      color="yellow"
    />
  )

  const SisRunButton = () => (
    <Button
      onClick={() => dispatch(sisRunJobAction(job.id))}
      content="Make a SIS-run"
      color="blue"
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
      <Grid.Column width={2}>{job.schedule}</Grid.Column>
      <Grid.Column width={2}>{getCourseCode()}</Grid.Column>
      <Grid.Column width={3}>{getCourseName()}</Grid.Column>
      <Grid.Column width={2}>{getGraderName()}</Grid.Column>
      <Grid.Column width={2}>{job.slug}</Grid.Column>
      <Grid.Column textAlign="center" width={1}>
        {job.active ? (
          <Icon name="check" color="green" size="large" />
        ) : (
          <Icon name="close" color="red" size="large" />
        )}
      </Grid.Column>
      <Grid.Column width={4}>
        <EditJob job={job} />
        <RunButton />
        <SisRunButton />
        {really ? <Confirm /> : <DeleteButton />}
      </Grid.Column>
    </Grid.Row>
  )
}
