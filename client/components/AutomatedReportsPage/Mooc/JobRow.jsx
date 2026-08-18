import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

import { deleteJobAction, runJobAction } from '@client/utils/redux/moocJobsReducer'
import EditJob from '@client/components/AutomatedReportsPage/Mooc/EditJob'

export default ({ job, jobs }) => {
  const dispatch = useDispatch()
  const [really, setReally] = useState(false)
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)

  const course = courses ? courses.find((c) => c.id === job.courseId) : null

  const getCourseName = () => (course ? course.name : null)

  const getCourseCode = () => (course ? course.courseCode : null)

  const getGraderName = () => {
    if (!graders) return null
    if (!job) return null
    const grader = graders.find((g) => g.id === job.graderId)
    return grader ? grader.name : null
  }

  const DeleteButton = () => (
    <Button
      variant="contained"
      color="error"
      data-cy={`delete-job-${course?.courseCode}`}
      disabled={jobs.pending}
      onClick={() => {
        setReally(true)
      }}
    >
      Delete
    </Button>
  )

  const CreateReportButton = () => (
    <Button
      variant="contained"
      data-cy={`create-report-${course?.courseCode}`}
      disabled={jobs.pending}
      onClick={() => dispatch(runJobAction(job.id))}
      sx={{ mx: 1 }}
    >
      Create report
    </Button>
  )

  const Confirm = () => (
    <ButtonGroup variant="contained">
      <Button
        data-cy="delete-job-cancel"
        onClick={() => {
          setReally(false)
        }}
      >
        Cancel
      </Button>
      <Button data-cy="delete-job-confirm" color="success" onClick={() => dispatch(deleteJobAction(job.id))}>
        Really delete
      </Button>
    </ButtonGroup>
  )
  return (
    <TableRow data-cy={`job-${course?.courseCode}`}>
      <TableCell>{job.schedule}</TableCell>
      <TableCell>{getCourseCode()}</TableCell>
      <TableCell>{getCourseName()}</TableCell>
      <TableCell>{getGraderName()}</TableCell>
      <TableCell>{job.slug}</TableCell>
      <TableCell align="center">{job.active ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</TableCell>
      <TableCell>{job.useManualCompletionDate ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</TableCell>
      <TableCell>
        <EditJob jobs={jobs} job={job} />
        <CreateReportButton />
        {really ? <Confirm /> : <DeleteButton />}
      </TableCell>
    </TableRow>
  )
}
