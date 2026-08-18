import Notification from '@client/components/Message'
import {
  getAllEnrollmentLimboEntriesAction,
  handleEntryDeletionAction,
  refreshEnrollmentsAction
} from '@client/utils/redux/sisReportsReducer'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, AlertTitle, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { EOAI_CODES, EOAI_NAMEMAP } from '@shared/common'
import moment from 'moment'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Pagination from './Pagination'

const getCourseCode = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].code
  }
  return course.courseCode
}

const getCourseName = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].name
  }
  return course.name
}

const DeleteButton = ({ id }) => {
  const dispatch = useDispatch()
  return (
    <Button
      variant="contained"
      data-cy={`report-entry-delete-button-${id}`}
      color="error"
      onClick={() => dispatch(handleEntryDeletionAction(id))}
    >
      Delete
    </Button>
  )
}

const RefreshEnrollmentsButton = () => {
  const dispatch = useDispatch()
  return (
    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => dispatch(refreshEnrollmentsAction())}>
      Refresh enrollments from Sisu
    </Button>
  )
}

const EnrolmentLimbo = () => {
  const dispatch = useDispatch()

  const { rows, offset, reportsFetched } = useSelector((state) => state.sisReports.enrolmentLimbo)
  const { pending } = useSelector((state) => state.sisReports)

  useEffect(() => {
    if (!reportsFetched && !pending) dispatch(getAllEnrollmentLimboEntriesAction(offset))
  })

  return (
    <>
      <Notification />
      {!rows.length && !pending && reportsFetched ? (
        <Alert severity="success">No completions without enrollment info!</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, opacity: pending ? 0.5 : 1 }}>
          <Alert severity="info" sx={{ maxWidth: 800, mb: 2 }}>
            <AlertTitle>What is enrollment limbo?</AlertTitle>
            Here is listed all individual completions without an enrollment in Sisu. Refresh enrollments button will
            check new enrollments from Sisu and create a new batch for entries with found enrollment. Refresh is done
            automatically once a week.
          </Alert>
          <RefreshEnrollmentsButton />
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Course code</TableCell>
                <TableCell>Course name</TableCell>
                <TableCell>Student number</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Completion date</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Date reported</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((rawEntry) => (
                <TableRow key={rawEntry.id}>
                  <TableCell data-cy={`report-course-code-${rawEntry.id}`}>
                    {getCourseCode(rawEntry, rawEntry.course)}
                  </TableCell>
                  <TableCell data-cy={`report-course-name-${rawEntry.id}`}>
                    {getCourseName(rawEntry, rawEntry.course)}
                  </TableCell>
                  <TableCell data-cy={`report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</TableCell>
                  <TableCell data-cy={`report-credits-${rawEntry.id}`}>{rawEntry.credits}</TableCell>
                  <TableCell data-cy={`report-personId-${rawEntry.id}`}>{rawEntry.entry.personId}</TableCell>
                  <TableCell data-cy={`report-completionDate-${rawEntry.id}`}>
                    {rawEntry.entry.completionDate ? moment(rawEntry.entry.completionDate).format('DD.MM.YYYY') : null}
                  </TableCell>
                  <TableCell data-cy={`report-completionLanguage-${rawEntry.id}`}>
                    {rawEntry.entry.completionLanguage ? rawEntry.entry.completionLanguage : null}
                  </TableCell>
                  <TableCell data-cy={`report-completionDate-${rawEntry.id}`}>
                    {moment(rawEntry.createdAt).format('DD.MM.YYYY')}
                  </TableCell>
                  <TableCell>
                    <DeleteButton id={rawEntry.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination reduxKey="enrolmentLimbo" action={getAllEnrollmentLimboEntriesAction} disableFilters />
        </Paper>
      )}
    </>
  )
}

export default EnrolmentLimbo
