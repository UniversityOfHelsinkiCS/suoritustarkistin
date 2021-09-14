import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Icon, Popup, Table } from 'semantic-ui-react'

import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'

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

const changedStyle = {
  background: '#d6eaf8'
}

const invalidStyle = {
  background: '#fddede'
}

const hasOpenUniRegistration = (course, studentId, registrations) => {
  if (!course || !course.autoSeparate || !registrations) return false
  return registrations.find((r) => r.onro === studentId)
}

const getOpenUniCourseCell = (course) => {
  if (course) {
    return (
      <Table.Cell style={changedStyle}>
        {`${course.name} (${course.autoSeparate ? course.courseCode.split('+')[0] : course.courseCode})`}
      </Table.Cell>
    )
  }
  return <Table.Cell />
}

const getCourseCell = (rowCourseCode, defaultCourse, courses) => {
  if (rowCourseCode) {
    const course = courses.find((c) => c.courseCode === rowCourseCode)
    if (course) {
      return (
        <Table.Cell style={validStyle}>
          {`${course.name} (${course.autoSeparate ? course.courseCode.split('+')[1] : course.courseCode})`}
        </Table.Cell>
      )  
    }
  }

  if (defaultCourse) {
    return (
      <Table.Cell style={validStyle}>
        {`${defaultCourse.name} (${defaultCourse.autoSeparate ? defaultCourse.courseCode.split('+')[1] : defaultCourse.courseCode})`}
      </Table.Cell>
    )
  }

  return <Table.Cell />
}

const getStudentIdCell = (studentId, registration, duplicate) => {
  if (duplicate && registration) {
    return (
      <Table.Cell style={invalidStyle}>
        <Icon name="ban" />
        {`${studentId} (${registration.onro})`} DUPLICATE!
      </Table.Cell>
    )
  }
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
  if (registration) {
    return (
      <Table.Cell style={changedStyle}>
        {`${studentId} (${registration.onro})`}
      </Table.Cell>
    )
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
  } else if (!grade && defaultGrade) {
    return (
      <Table.Cell style={validStyle}>
        Hyv.
      </Table.Cell>
    )
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
  if (course) {
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
  if (course) {
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
          content={future
            ? <p>Completion date <strong>set to future</strong>, check that it is correct. Adding completions to this date is still possible.</p>
            : <p>Completion date <strong>set far back in the past</strong>, check that it is correct. Adding completions to this date is still possible.</p>
          }
        />
      )
    }
    if (isValidDate(date)) {
      return <Table.Cell style={validStyle}>{`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}</Table.Cell>
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

const getErrorCell = (newRawEntries, studentId) => {
  const failed = newRawEntries.failed

  if (failed) {
    const failedRow = failed.find((f) => f.studentNumber === studentId)

    if (failedRow) {
      return (
        <Table.Cell style={invalidStyle}>
          <Icon name="ban" />
          {failedRow.message}
        </Table.Cell>
      )
    } else {
      return <Table.Cell />
    }
  }

  return null
}


const getDeletionCell = (index, handleRowDeletion) => {
  return (
    <Table.Cell style={validStyle}>
      <Button
        style={{ width: "100%" }}
        icon="trash"
        onClick={() => handleRowDeletion(index)}
      />
    </Table.Cell>
  )
}

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)
  const registrations = useSelector((state) => state.registrations.data)

  if (!newRawEntries.data) return null

  const grader = graders.find(
    (g) => g.employeeId === newRawEntries.graderId
  )
  const defaultGrade = newRawEntries.defaultGrade
  const course = courses.find((c) => c.id === newRawEntries.courseId)
  const date = newRawEntries.date ? newRawEntries.date : 'add completion date'

  const handleRowDeletion = (index) => {
    const rows = newRawEntries.rawData.trim().split('\n')
    const rowsWithoutTheStudent = rows.filter((r, i) => i !== index)
    const rawData = rowsWithoutTheStudent.join("\n")
    dispatch(setNewRawEntriesAction({ ...newRawEntries, rawData, data: newRawEntries.data.filter((s, i) => i !== index)}))
  }

  const reportRows = newRawEntries.data.map((row, index) => (
    <Table.Row key={row.studentId + index}>
      {row.registration ||
      hasOpenUniRegistration(course, row.studentId, registrations)
        ? getOpenUniCourseCell(course)
        : getCourseCell(row.course, course, courses)}
      {getStudentIdCell(row.studentId, row.registration, row.duplicate)}
      {getGradeCell(row.grade, defaultGrade)}
      {getCreditCell(row.credits, course)}
      {getLanguageCell(row.language, course)}
      {grader ? (
        <Table.Cell style={validStyle}>{grader.name}</Table.Cell>
      ) : (
        <Table.Cell />
      )}
      {getDateCell(row.attainmentDate || date)}
      {getErrorCell(newRawEntries, row.studentId)}
      {getDeletionCell(index, handleRowDeletion)}
    </Table.Row>
  ))

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={3}>Course</Table.HeaderCell>
          <Table.HeaderCell width={2}>Student number</Table.HeaderCell>
          <Table.HeaderCell width={1}>Grade</Table.HeaderCell>
          <Table.HeaderCell width={1}>Credits (op)</Table.HeaderCell>
          <Table.HeaderCell width={1}>Language</Table.HeaderCell>
          <Table.HeaderCell width={2}>Grader</Table.HeaderCell>
          <Table.HeaderCell>Completion date</Table.HeaderCell>
          {newRawEntries.failed && <Table.HeaderCell>Errors</Table.HeaderCell>}
          <Table.HeaderCell width={1}>Remove from report</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{reportRows}</Table.Body>
    </Table>
  )
}
