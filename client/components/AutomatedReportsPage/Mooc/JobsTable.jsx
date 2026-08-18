import React from 'react'
import { useSelector } from 'react-redux'
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import * as _ from 'lodash'

import JobRow from '@client/components/AutomatedReportsPage/Mooc/JobRow'

export default () => {
  const jobs = useSelector((state) => state.moocJobs)
  const courses = useSelector((state) => state.courses.data)

  if (!jobs || !jobs.data) return null

  const sortedJobs = _.orderBy(
    jobs.data,
    [
      'active',
      (job) => {
        const course = courses?.find((c) => c.id === job.courseId)
        return course?.name?.toLowerCase() || ''
      }
    ],
    ['desc', 'asc']
  )

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      {jobs.pending ? <CircularProgress size={40} sx={{ m: 2 }} /> : null}
      <Table
        data-cy="mooc-job-table"
        size="small"
        sx={{
          '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
          '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '6%', fontWeight: 700 }}>Schedule</TableCell>
            <TableCell sx={{ width: '12%', fontWeight: 700 }}>Course code</TableCell>
            <TableCell sx={{ width: '19%', fontWeight: 700 }}>Course name</TableCell>
            <TableCell sx={{ width: '12%', fontWeight: 700 }}>Grader</TableCell>
            <TableCell sx={{ width: '12%', fontWeight: 700 }}>Slug</TableCell>
            <TableCell sx={{ width: '6%', fontWeight: 700 }}>Active</TableCell>
            <TableCell sx={{ width: '6%', fontWeight: 700 }}>Use manual completion date</TableCell>
            <TableCell sx={{ width: '25%', fontWeight: 700 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedJobs.map((j) => (
            <JobRow job={j} jobs={jobs} key={j.id} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
