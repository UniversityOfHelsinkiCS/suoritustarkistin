import moment from 'moment'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import NotificationMessage from '@client/components/Message'

import { resetNewRawEntriesConfirmAction, resetNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import {
  handleBatchDeletionAction,
  sendEntriesToSisAction,
  openReport,
  sendMissingEnrollmentEmail
} from '@client/utils/redux/sisReportsReducer'

const styles = {
  extraEntry: {
    backgroundColor: '#F8FCFF'
  },
  missingEnrolment: {
    backgroundColor: '#F8FCFF'
  },
  missingEnrolmentInfo: {
    maxWidth: '620px'
  },
  completionDate: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}

const getGrade = (gradeScaleId, gradeId, language) => {
  if (!gradeId || !gradeScaleId || !language) return null
  if (gradeScaleId === 'sis-0-5') return gradeId
  if (gradeScaleId === 'sis-hyl-hyv') {
    const gradeMap = [
      { en: 'Fail', fi: 'Hyl.', sv: 'F' },
      { en: 'Pass', fi: 'Hyv.', sv: 'G' }
    ]
    const grade = gradeMap[gradeId]
    if (!grade) return null
    return grade[language]
  }
  return null
}

const getGraderName = (graderId, graders) => {
  const { name } = graders.find(({ id }) => id === graderId)
  return name
}

export default ({ rows, batchId }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { pending, error } = useSelector((state) => state.sisReports)
  const graderId = useSelector((state) => state.newRawEntries.graderId)
  const graders = useSelector((state) => state.graders.data)
  const [sent, setSent] = useState(false)
  const [confirmAnchor, setConfirmAnchor] = useState(null)
  const onlyMissingEnrollments = rows.every(({ entry }) => entry.type === 'ENTRY' && entry.missingEnrolment)
  const dateHasChanged = rows.some(
    ({ entry, attainmentDate }) => !moment(attainmentDate).isSame(moment(entry.completionDate), 'day')
  )

  useEffect(() => {
    if (sent && !pending && !(error || {}).genericError) {
      dispatch(openReport(batchId))
      dispatch(resetNewRawEntriesAction({ graderId }))
      navigate('/reports')
    }
  }, [pending, error, sent, dispatch])

  useEffect(() => {
    window.onbeforeunload = () => '' // Display confirmation alert when tab is closed
    return () => (window.onbeforeunload = null)
  })

  const entriesToSisu = rows
    .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
    .reduce(
      (acc, { entry }) => {
        if (entry.type === 'ENTRY') acc.entries.push(entry.id)
        else acc.extraEntries.push(entry.id)
        return acc
      },
      { entries: [], extraEntries: [] }
    )

  const getCourseUnitRealisationName = (entry) => {
    if (entry.missingEnrolment) return 'Missing enrollment'
    if (entry.type === 'EXTRA_ENTRY') return 'Erilliskirjaus'
    return entry.courseUnitRealisationName
      ? JSON.parse(entry.courseUnitRealisationName).fi || JSON.parse(entry.courseUnitRealisationName).en
      : null
  }

  const send = async () => {
    const { entries, extraEntries } = rows
      .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
      .reduce(
        (acc, { entry }) => {
          if (entry.type === 'ENTRY') acc.entries.push(entry.id)
          else acc.extraEntries.push(entry.id)
          return acc
        },
        { entries: [], extraEntries: [] }
      )
    if (entries.length || extraEntries.length) await dispatch(sendEntriesToSisAction(entries, extraEntries))
    else dispatch(sendMissingEnrollmentEmail(batchId))
    setSent(true)
  }

  const SendButton = () => {
    if (onlyMissingEnrollments)
      return (
        <Button
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          onClick={send}
          disabled={pending}
          data-cy="confirm-entries-send-missing-enrolment"
        >
          Approve
        </Button>
      )

    // Semantic's on="click" Popup held an interactive button, so this is a Popover with
    // its own anchor rather than a Tooltip.
    return (
      <>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          disabled={pending}
          data-cy="confirm-entries-send"
          onClick={(e) => setConfirmAnchor(e.currentTarget)}
        >
          Approve
        </Button>
        <Popover
          open={Boolean(confirmAnchor)}
          anchorEl={confirmAnchor}
          onClose={() => setConfirmAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Box sx={{ p: 1 }}>
            <Button variant="contained" color="success" data-cy="confirm-entries-send-confirm" onClick={send}>
              {`Are you sure? Sending ${
                entriesToSisu.entries.length + entriesToSisu.extraEntries.length
              } completion(s) to Sisu`}
            </Button>
          </Box>
        </Popover>
      </>
    )
  }

  const MissingEnrollmentsInfo = () =>
    onlyMissingEnrollments ? (
      <Alert severity="warning" sx={styles.missingEnrolmentInfo}>
        The report contains only completions with missing enrollments and nothing will be sent to Sisu.
        <br />
        When a student enrolls to the course the completion will be sent automatically to Sisu.
      </Alert>
    ) : null

  const ChangedDateInfo = () =>
    dateHasChanged ? (
      <Alert severity="warning" sx={styles.missingEnrolmentInfo}>
        One or more completion date has been changed to match the study right in the enrollment.
        <br />
        The changed dates are marked with a pencil icon. Please check the new dates before approving.
      </Alert>
    ) : null

  const CompletionDate = ({ attainmentDate, completionDate }) =>
    completionDate ? (
      <div style={styles.completionDate}>
        <span>{moment(completionDate).format('DD.MM.YYYY')}</span>
        {!moment(attainmentDate).isSame(moment(completionDate), 'day') ? (
          <Tooltip
            title={`Completion date is adjusted automatically to match the study right in the enrollment. Original completion date was ${moment(
              attainmentDate
            ).format('DD.MM.YYYY')}`}
          >
            <EditIcon fontSize="small" />
          </Tooltip>
        ) : null}
      </div>
    ) : null

  const revert = () => {
    dispatch(resetNewRawEntriesConfirmAction())
    dispatch(handleBatchDeletionAction(batchId))
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box>
        <Typography variant="h6" component="h3" gutterBottom>
          Check and approve the entries
        </Typography>
        <p>After approving, the completions will be sent to Sisu.</p>
        <Divider />
        <p>
          Entries with missing enrollments are saved to Suotar and the completions will be sent to Sisu automatically
          after student enrolls to the course.{' '}
        </p>
        <MissingEnrollmentsInfo />
        <ChangedDateInfo />
      </Box>
      {sent && error ? (
        <Box>
          <NotificationMessage />
        </Box>
      ) : null}
      <Box sx={{ opacity: pending ? 0.5 : 1 }}>
        <Table
          size="small"
          sx={{
            '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
            '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Student number</TableCell>
              <TableCell>Student name</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Completion date</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Grader</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Course name</TableCell>
              <TableCell>Course realisation name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody data-cy="confirm-entries-table">
            {rows.map(({ entry, ...rawEntry }) => (
              <TableRow
                key={entry.id}
                sx={entry.missingEnrolment ? { backgroundColor: '#fffaf3' } : null}
                style={entry.type === 'EXTRA_ENTRY' ? styles.extraEntry : null}
              >
                <TableCell>{rawEntry.studentNumber}</TableCell>
                <TableCell>{entry.studentName}</TableCell>
                <TableCell>
                  {!entry.missingEnrolment || entry.type === 'EXTRA_ENTRY'
                    ? getGrade(entry.gradeScaleId, entry.gradeId, entry.completionLanguage)
                    : rawEntry.grade}
                </TableCell>
                <TableCell>
                  <CompletionDate attainmentDate={rawEntry.attainmentDate} completionDate={entry.completionDate} />
                </TableCell>
                <TableCell>{rawEntry.language}</TableCell>
                <TableCell>{getGraderName(rawEntry.graderId, graders)}</TableCell>
                <TableCell>{rawEntry.credits}</TableCell>
                <TableCell>{rawEntry.course.name}</TableCell>
                <TableCell>{getCourseUnitRealisationName(entry)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <SendButton />
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={pending}
          onClick={revert}
          data-cy="confirm-entries-cancel"
        >
          Cancel
        </Button>
      </Stack>
    </Paper>
  )
}
