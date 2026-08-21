import { celledBorders } from '@client/components/tableStyles'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from '@mui/material'
import moment from 'moment'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { importStudentsAction, importStudentsAttainments } from '../../utils/redux/newRawEntriesReducer'

const styles = {
  tdPadded: {
    paddingLeft: '3rem'
  },
  input: {
    width: '3.5rem'
  },
  table: {
    minHeight: '420px',
    maxHeight: '600px',
    overflow: 'auto'
  },
  confirmTable: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  dateHeader: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  dropdown: {
    marginRight: '1rem'
  },
  label: {
    margin: '0.125rem'
  }
}

const GRADES = {
  'sis-hyl-hyv': [
    {
      key: 'hyl.',
      text: 'Failed',
      value: 'hyl.'
    },
    {
      key: 'hyv.',
      text: 'Pass',
      value: 'hyv.'
    }
  ],
  'sis-0-5': [
    {
      key: 'hyl.',
      text: 'Failed',
      value: 'hyl.'
    },
    {
      key: '1',
      text: '1',
      value: '1'
    },
    {
      key: '2',
      text: '2',
      value: '2'
    },
    {
      key: '3',
      text: '3',
      value: '3'
    },
    {
      key: '4',
      text: '4',
      value: '4'
    },
    {
      key: '5',
      text: '5',
      value: '5'
    }
  ]
}

const renderAttainments = ({ attainments: attainmentsForStudent }) => {
  const earlierAttainments = attainmentsForStudent.map(({ gradeScaleId, state, grade, attainmentDate, personId }) => {
    const getGradeString = () => {
      if (state === 'FAILED') return 'Failed'
      if (gradeScaleId === 'sis-hyl-hyv') return grade.name.en
      return grade.numericCorrespondence
    }
    const date = moment(attainmentDate).format('DD.MM.YYYY')
    const gradeString = getGradeString()
    return (
      <Chip
        key={`${personId}${gradeString}${date}`}
        size="small"
        color={state === 'FAILED' ? 'error' : 'success'}
        sx={styles.label}
        label={`${gradeString}, ${date}`}
      />
    )
  })

  // Remove duplicates caused by AssesmentItemAttainment --> CourseUnitAttainment
  return [...new Map(earlierAttainments.map(({ key, ...item }) => [key, { ...item, key }])).values()]
}

const ExpandableRow = ({
  rows,
  title,
  get,
  set,
  date,
  gradeScale,
  fetchAttainments,
  allAttainments,
  hideWithAttainment
}) => {
  const [open, setOpen] = useState(false)

  const toggleOpen = () => {
    if (!open) fetchAttainments(rows.map(({ person }) => person.studentNumber))
    setOpen(!open)
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <Box component="span" onClick={toggleOpen} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
            {title}
          </Box>
        </TableCell>
        <TableCell />
      </TableRow>
      {open ? (
        <>
          {rows
            .filter(({ person }) => {
              if (!hideWithAttainment) return true
              const completions = allAttainments.data.find((a) => a.studentNumber === person.studentNumber)
              return completions ? completions.attainments.every(({ state }) => state === 'FAILED') : true
            })
            .sort((a, b) =>
              `${a.person.lastName}, ${a.person.firstNames} (${a.person.studentNumber})`.localeCompare(
                `${b.person.lastName}, ${b.person.firstNames} (${b.person.studentNumber})`
              )
            )
            .map(({ person, id }) => (
              <TableRow key={id}>
                <TableCell style={styles.tdPadded}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      select
                      size="small"
                      label="Grade"
                      sx={{ ...styles.dropdown, minWidth: '8rem' }}
                      value={get(person.studentNumber)}
                      onChange={(e) => set({ value: e.target.value }, person, date)}
                    >
                      {GRADES[gradeScale].map((g) => (
                        <MenuItem key={g.key} value={g.value} data-cy={`grade-option-${g.value}`}>
                          {g.text}
                        </MenuItem>
                      ))}
                    </TextField>
                    <span>{`${person.lastName}, ${person.firstNames} (${person.studentNumber})`}</span>
                  </Box>
                </TableCell>
                <TableCell>
                  {allAttainments.pending &&
                  !allAttainments.data.find((a) => a.studentNumber === person.studentNumber) ? (
                    <>
                      <Skeleton variant="text" width="100%" />
                    </>
                  ) : (
                    renderAttainments(
                      allAttainments.data
                        ? allAttainments.data.find((a) => a.studentNumber === person.studentNumber) || {
                            attainments: []
                          }
                        : { attainments: [] }
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
        </>
      ) : null}
    </>
  )
}

const getTitle = (row) => {
  const includeYearToStart =
    moment(row.activityPeriod.startDate).get('year') !== moment(row.activityPeriod.endDate).get('year')
  const start = moment(row.activityPeriod.startDate).format(includeYearToStart ? 'DD.MM.YYYY' : 'DD.MM.')
  const end = moment(row.activityPeriod.endDate).subtract(1, 'day').format('DD.MM.YYYY')
  return `${row.name.fi} (${start} - ${end}), ${row.enrollments.length} student(s)`
}

export default ({ isOpen, setIsOpen, importRows }) => {
  const dispatch = useDispatch()
  const [grades, setGrades] = useState({})
  const [confirm, setConfirm] = useState(false)
  const [hideWithAttainment, setHideWithAttainment] = useState(false)
  const { defaultCourse } = useSelector((state) => state.newRawEntries)
  const { data, pending, error } = useSelector((state) => state.newRawEntries.importStudents)
  const { ...attainments } = useSelector((state) => state.newRawEntries.importStudentsAttainments)

  useEffect(() => {
    if (defaultCourse) {
      dispatch(importStudentsAction(defaultCourse))
      setGrades({})
    }
  }, [defaultCourse, dispatch])

  const fetchAttainments = (students) =>
    dispatch(importStudentsAttainments(students.map((studentNumber) => ({ studentNumber, courseCode: defaultCourse }))))

  const set = ({ value: grade }, person, date) => {
    if (!grade) {
      const newGrades = { ...grades }
      delete newGrades[person.studentNumber]
      setGrades(newGrades)
    } else
      setGrades({
        ...grades,
        [person.studentNumber]: { name: `${person.lastName}, ${person.firstNames}`, grade, date }
      })
  }

  const get = (studentNumber) => {
    if (!grades[studentNumber]) return ''
    return grades[studentNumber].grade
  }

  const close = () => {
    setGrades({})
    setIsOpen(false)
    setConfirm(false)
  }

  return (
    <Dialog open={isOpen} maxWidth="lg" fullWidth onClose={close}>
      <DialogTitle>Select students to import</DialogTitle>
      {confirm ? (
        <SummaryTable rows={grades} />
      ) : (
        <DialogContent>
          {error ? <Alert severity="error">Failed to fetch enrollments.</Alert> : null}
          <Box sx={{ ...styles.table, opacity: pending ? 0.5 : 1 }}>
            {data.length || pending ? (
              <>
                <Alert severity="info">Select students by selecting a grade for each student to import.</Alert>
                <FormControlLabel
                  control={
                    <Switch onChange={(e) => setHideWithAttainment(e.target.checked)} checked={hideWithAttainment} />
                  }
                  label="Hide students with earlier completion"
                />
                <Table size="small" sx={celledBorders}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Students</TableCell>
                      <TableCell>Earlier completions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data
                      .sort((a, b) => moment(b.activityPeriod.startDate).diff(moment(a.activityPeriod.startDate)))
                      .map((r) => {
                        const title = getTitle(r)
                        return (
                          <ExpandableRow
                            title={title}
                            rows={r.enrollments}
                            gradeScale={r.gradeScaleId}
                            date={
                              moment(r.activityPeriod.startDate).isSame(
                                moment(r.activityPeriod.endDate).subtract(1, 'day'),
                                'days'
                              )
                                ? moment(r.activityPeriod.startDate).format('D.M.YYYY')
                                : null
                            }
                            key={title}
                            allAttainments={attainments}
                            hideWithAttainment={hideWithAttainment}
                            fetchAttainments={fetchAttainments}
                            get={get}
                            set={set}
                          />
                        )
                      })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <Alert severity="info">{`No enrollments found for course ${defaultCourse}`}</Alert>
            )}
          </Box>
        </DialogContent>
      )}

      <DialogActions>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (confirm) return setConfirm(false)
            close()
          }}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            if (!confirm) return setConfirm(true)
            importRows(grades)
            close()
          }}
          disabled={pending || !Object.keys(grades).length}
        >
          {!confirm ? 'Import' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SummaryTable = ({ rows }) => (
  <Table sx={{ ...styles.confirmTable, ...celledBorders }} size="small">
    <TableHead>
      <TableRow>
        <TableCell>Student</TableCell>
        <TableCell>Grade</TableCell>
        <TableCell style={styles.dateHeader}>
          Date
          <Tooltip title="Completion date is added automatically if importing students from an exam">
            <HelpOutlinedIcon fontSize="small" />
          </Tooltip>
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {Object.keys(rows).map((key) => {
        const { name, grade, date } = rows[key]
        return (
          <TableRow key={name}>
            <TableCell>{`${name} (${key})`}</TableCell>
            <TableCell>{grade}</TableCell>
            <TableCell>{date}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
