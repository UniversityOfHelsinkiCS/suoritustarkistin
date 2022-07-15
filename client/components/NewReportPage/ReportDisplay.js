import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Icon, Popup, Table } from 'semantic-ui-react'

import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { parseCSV } from 'Utilities/inputParser'

import './reportDisplay.css'

const { commify } = require('Root/utils/commify')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage,
  isValidDate,
  isFutureDate,
  isPastDate,
  isDateObject
} = require('Root/utils/validators')

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
    return <Table.Cell style={validStyle}>{`${course.name} (${course.courseCode})`}</Table.Cell>
  }
  if (course) {
    return <Table.Cell style={invalidStyle}>{course}</Table.Cell>
  }
  return <Table.Cell />
}

const getStudentIdCell = (studentId, duplicate) => {
  if (duplicate) {
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {studentId} DUPLICATE!
      </Table.Cell>
    )
  }
  if (isValidStudentId(studentId)) {
    return <Table.Cell style={validStyle}>{studentId}</Table.Cell>
  }
  return (
    <Table.Cell style={invalidStyle}>
      <Icon name="ban" />
      {studentId}
    </Table.Cell>
  )
}

const getGradeCell = (grade, defaultGrade) => {
  if (grade) {
    if (isValidGrade(grade)) {
      return <Table.Cell style={validStyle}>{grade}</Table.Cell>
    }
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {grade}
      </Table.Cell>
    )
  }
  if (!grade && defaultGrade) {
    return <Table.Cell style={validStyle}>Hyv.</Table.Cell>
  }

  return (
    <Table.Cell style={invalidStyle}>
      <Icon name="ban" />
      Add grade
    </Table.Cell>
  )
}

const getCreditCell = (credits, course) => {
  if (credits) {
    if (isValidCreditAmount(credits)) {
      return <Table.Cell style={validStyle}>{commify(credits)}</Table.Cell>
    }
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {credits}
      </Table.Cell>
    )
  }
  if (course && course.credits) {
    return <Table.Cell style={validStyle}>{course.credits}</Table.Cell>
  }

  return <Table.Cell />
}

const getLanguageCell = (language, course) => {
  if (language) {
    if (isValidLanguage(language)) {
      return <Table.Cell style={validStyle}>{language}</Table.Cell>
    }
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {language}
      </Table.Cell>
    )
  }
  if (course && course.language) {
    return <Table.Cell style={validStyle}>{course.language}</Table.Cell>
  }
  return <Table.Cell />
}

const getDateCell = (date) => {
  if (date) {
    const past = isPastDate(date)
    const future = isFutureDate(date)
    if (past || future) {
      return (
        <Popup
          trigger={
            <Table.Cell style={warningStyle}>
              <Icon name="exclamation" />
              {`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}
            </Table.Cell>
          }
          mouseEnterDelay={300}
          mouseLeaveDelay={500}
          content={
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
        />
      )
    }
    if (isValidDate(date)) {
      return (
        <Table.Cell style={validStyle}>{`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}</Table.Cell>
      )
    }
    if (isDateObject(date)) {
      return (
        <Table.Cell style={invalidStyle}>
          <Icon name="ban" />
          {`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}
        </Table.Cell>
      )
    }
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {date}
      </Table.Cell>
    )
  }
  return <Table.Cell />
}

const getErrorCell = (newRawEntries, studentId, courseCode) => {
  const { failed } = newRawEntries

  if (failed) {
    const failedRow = failed.find((f) => f.studentNumber === studentId && f.courseCode === courseCode)

    if (failedRow) {
      return (
        <Table.Cell style={invalidStyle}>
          <Icon name="ban" />
          {failedRow.message}
        </Table.Cell>
      )
    }
    return <Table.Cell />
  }

  return null
}

const getDeletionCell = (index, handleRowDeletion) => (
  <Table.Cell style={validStyle}>
    <Button style={{ width: '100%' }} icon="trash" onClick={() => handleRowDeletion(index)} />
  </Table.Cell>
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

  const grader = graders.find((g) => g.employeeId === newRawEntries.graderId)
  const { defaultGrade } = newRawEntries
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
      <Table.Row key={row.studentId + index} className={kandi && row.isExtra ? 'extra-entry' : ''}>
        {getCourseCell(course)}
        {getStudentIdCell(row.studentId, row.registration, row.duplicate)}
        {getGradeCell(row.grade, defaultGrade)}
        {getCreditCell(row.credits, course)}
        {getLanguageCell(row.language, course)}
        {grader ? <Table.Cell style={validStyle}>{grader.name}</Table.Cell> : <Table.Cell />}
        {getDateCell(row.attainmentDate || date)}
        {getErrorCell(newRawEntries, row.studentId, course.courseCode)}
        {allowDelete ? getDeletionCell(index, handleRowDeletion) : null}
      </Table.Row>
    )
  })

  return (
    <Table celled data-cy="new-report-table" basic compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Course</Table.HeaderCell>
          <Table.HeaderCell>Student number</Table.HeaderCell>
          <Table.HeaderCell>Grade</Table.HeaderCell>
          <Table.HeaderCell>Credits (op)</Table.HeaderCell>
          <Table.HeaderCell>Language</Table.HeaderCell>
          <Table.HeaderCell>Grader</Table.HeaderCell>
          <Table.HeaderCell>Completion date</Table.HeaderCell>
          {newRawEntries.failed && <Table.HeaderCell>Errors</Table.HeaderCell>}
          {allowDelete ? <Table.HeaderCell>Remove from report</Table.HeaderCell> : null}
        </Table.Row>
      </Table.Header>
      <Table.Body>{reportRows}</Table.Body>
    </Table>
  )
}
