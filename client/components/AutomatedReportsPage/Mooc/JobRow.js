import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Icon, Table } from 'semantic-ui-react'

import { deleteJobAction, runJobAction } from 'Utilities/redux/moocJobsReducer'
import EditJob from 'Components/AutomatedReportsPage/Mooc/EditJob'

export default ({ job, jobs }) => {
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
    if (!job) return null
    const grader = graders.find((g) => g.id === job.graderId)
    return grader ? grader.name : null
  }

  const DeleteButton = () => (
    <Button
      data-cy={`delete-job-${course?.courseCode}`}
      disabled={jobs.pending}
      onClick={() => {
        setReally(true)
      }}
      content="Delete"
      negative
    />
  )

  const CreateReportButton = () => (
    <Button
      data-cy={`create-report-${course?.courseCode}`}
      disabled={jobs.pending}
      onClick={() => dispatch(runJobAction(job.id))}
      content="Create report"
      color="blue"
    />
  )

  const Confirm = () => (
    <Button.Group>
      <Button
        data-cy="delete-job-cancel"
        onClick={() => {
          setReally(false)
        }}
        content="Cancel"
      />
      <Button
        data-cy="delete-job-confirm"
        onClick={() => dispatch(deleteJobAction(job.id))}
        content="Really delete"
        positive
      />
    </Button.Group>
  )
  return (
    <Table.Row data-cy={`job-${course?.courseCode}`}>
      <Table.Cell width={1}>{job.schedule}</Table.Cell>
      <Table.Cell width={2}>{getCourseCode()}</Table.Cell>
      <Table.Cell width={3}>{getCourseName()}</Table.Cell>
      <Table.Cell width={2}>{getGraderName()}</Table.Cell>
      <Table.Cell width={2}>{job.slug}</Table.Cell>
      <Table.Cell textAlign="center" width={1}>
        {job.active ? <Icon name="check" color="green" size="large" /> : <Icon name="close" color="red" size="large" />}
      </Table.Cell>
      <Table.Cell>
        {job.useManualCompletionDate ? (
          <Icon name="check" color="green" size="large" />
        ) : (
          <Icon name="close" color="red" size="large" />
        )}
      </Table.Cell>
      <Table.Cell width={4}>
        <EditJob jobs={jobs} job={job} />
        <CreateReportButton />
        {really ? <Confirm /> : <DeleteButton />}
      </Table.Cell>
    </Table.Row>
  )
}
