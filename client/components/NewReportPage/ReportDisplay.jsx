import { parseCSV } from '@client/utils/inputParser'
import { setNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import BlockIcon from '@mui/icons-material/Block'
import DeleteIcon from '@mui/icons-material/Delete'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import { IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import { commify } from '@shared/commify'
import {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage,
  isValidDate,
  isFutureDate,
  isPastDate,
  isDateObject
} from '@shared/validators'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import './reportDisplay.css'

const validStyle = {
  background: '#d2f3db'
}

const warningStyle = {
  background: '#f7d96a'
}

const invalidStyle = {
  background: '#fddede'
}

const getCourseCell = (course) => {
  if (course.courseCode) {
    return <TableCell style={validStyle}>{`${course.name} (${course.courseCode})`}</TableCell>
  }
  if (course) {
    return <TableCell style={invalidStyle}>{course}</TableCell>
  }
  return <TableCell />
}

const getStudentIdCell = (studentId, duplicate) => {
  if (duplicate) {
    return (
      <TableCell style={invalidStyle}>
        <BlockIcon fontSize="small" />
        {studentId} DUPLICATE!
      </TableCell>
    )
  }
  if (isValidStudentId(studentId)) {
    return <TableCell style={validStyle}>{studentId}</TableCell>
  }
  return (
    <TableCell style={invalidStyle}>
      <BlockIcon fontSize="small" />
      {studentId}
    </TableCell>
  )
}

const getGradeCell = (grade, defaultGrade) => {
  if (grade) {
    if (isValidGrade(grade)) {
      return <TableCell style={validStyle}>{grade}</TableCell>
    }
    return (
      <TableCell style={invalidStyle}>
        <BlockIcon fontSize="small" />
        {grade}
      </TableCell>
    )
  }
  if (!grade && defaultGrade) {
    return <TableCell style={validStyle}>Hyv.</TableCell>
  }

  return (
    <TableCell style={invalidStyle}>
      <BlockIcon fontSize="small" />
      Add grade
    </TableCell>
  )
}

const getCreditCell = (credits, course) => {
  if (credits) {
    if (isValidCreditAmount(credits)) {
      return <TableCell style={validStyle}>{commify(credits)}</TableCell>
    }
    return (
      <TableCell style={invalidStyle}>
        <BlockIcon fontSize="small" />
        {credits}
      </TableCell>
    )
  }
  if (course && course.credits) {
    return <TableCell style={validStyle}>{course.credits}</TableCell>
  }

  return <TableCell />
}

const getLanguageCell = (language, course) => {
  if (language) {
    if (isValidLanguage(language)) {
      return <TableCell style={validStyle}>{language}</TableCell>
    }
    return (
      <TableCell style={invalidStyle}>
        <BlockIcon fontSize="small" />
        {language}
      </TableCell>
    )
  }
  if (course && course.language) {
    return <TableCell style={validStyle}>{course.language}</TableCell>
  }
  return <TableCell />
}

const getGraderCell = (graderId, graders) => {
  const grader = graders.find((g) => g.employeeId === graderId)
  if (grader) {
    return <TableCell style={validStyle}>{grader.name}</TableCell>
  }

  return <TableCell />
}

const getDateCell = (date) => {
  if (date) {
    const past = isPastDate(date)
    const future = isFutureDate(date)
    if (past || future) {
      return (
        <Tooltip
          enterDelay={300}
          leaveDelay={500}
          title={
            future ? (
              <p>
                Completion date <strong>set to future</strong>, check that it is correct. Adding completions to this
                date is still possible.
              </p>
            ) : (
              <p>
                Completion date <strong>set far back in the past</strong>, check that it is correct. Adding completions
                to this date is still possible.
              </p>
            )
          }
        >
          <TableCell style={warningStyle}>
            <PriorityHighIcon fontSize="small" />
            {`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}
          </TableCell>
        </Tooltip>
      )
    }
    if (isValidDate(date)) {
      return (
        <TableCell style={validStyle}>{`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}</TableCell>
      )
    }
    if (isDateObject(date)) {
      return (
        <TableCell style={invalidStyle}>
          <BlockIcon fontSize="small" />
          {`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}
        </TableCell>
      )
    }
    return (
      <TableCell style={invalidStyle}>
        <BlockIcon fontSize="small" />
        {date}
      </TableCell>
    )
  }
  return <TableCell />
}

const getErrorCell = (newRawEntries, studentId, courseCode) => {
  const { failed } = newRawEntries

  if (failed) {
    const failedRow = failed.find((f) => f.studentNumber === studentId && f.courseCode === courseCode)

    if (failedRow) {
      return (
        <TableCell style={invalidStyle}>
          <BlockIcon fontSize="small" />
          {failedRow.message}
        </TableCell>
      )
    }
    return <TableCell />
  }

  return null
}

const getDeletionCell = (index, handleRowDeletion) => (
  <TableCell style={validStyle}>
    <IconButton aria-label="Remove from report" onClick={() => handleRowDeletion(index)}>
      <DeleteIcon />
    </IconButton>
  </TableCell>
)

const validCourse = (course, courses) => courses.find((c) => c.courseCode === course)

const getCourse = (row, courses, defaultCourse) => {
  if (row.course && validCourse(row.course, courses)) return validCourse(row.course, courses)
  if (row.course) return row.course
  if (defaultCourse) return defaultCourse
  return row.course
}

export default ({ allowDelete = true, kandi }) => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)

  if (!newRawEntries.data) return null

  const { defaultGrade, graderId } = newRawEntries
  const defaultCourse = courses.find((c) => c.id === newRawEntries.courseId)
  const date = newRawEntries.date ? newRawEntries.date : 'add completion date'

  const handleRowDeletion = (index) => {
    const rows = newRawEntries.rawData.trim().split('\n')
    const rowsWithoutTheStudent = rows.filter((r, i) => i !== index)
    const rawData = rowsWithoutTheStudent.join('\n')
    dispatch(
      setNewRawEntriesAction({ ...newRawEntries, rawData, data: parseCSV(rawData, newRawEntries.defaultCourse) })
    )
  }

  const reportRows = newRawEntries.data.map((row, index) => {
    const course = getCourse(row, courses, defaultCourse)

    return (
      <TableRow key={row.studentId + index} className={kandi && row.isExtra ? 'extra-entry' : ''}>
        {getCourseCell(course)}
        {getStudentIdCell(row.studentId, row.registration, row.duplicate)}
        {getGradeCell(row.grade, defaultGrade)}
        {getCreditCell(row.credits, course)}
        {getLanguageCell(row.language, course)}
        {getGraderCell(row.graderId || graderId, graders)}
        {getDateCell(row.attainmentDate || date)}
        {getErrorCell(newRawEntries, row.studentId, course.courseCode)}
        {allowDelete ? getDeletionCell(index, handleRowDeletion) : null}
      </TableRow>
    )
  })

  return (
    <Table
      size="small"
      data-cy="new-report-table"
      sx={{
        '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
        '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>Course</TableCell>
          <TableCell>Student number</TableCell>
          <TableCell>Grade</TableCell>
          <TableCell>Credits (op)</TableCell>
          <TableCell>Language</TableCell>
          <TableCell>Grader</TableCell>
          <TableCell>Completion date</TableCell>
          {newRawEntries.failed && <TableCell>Errors</TableCell>}
          {allowDelete ? <TableCell>Remove from report</TableCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>{reportRows}</TableBody>
    </Table>
  )
}
