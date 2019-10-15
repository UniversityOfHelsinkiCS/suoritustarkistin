import React from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { useSelector } from 'react-redux'

const { commify } = require('Root/utils/commify')

const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage
} = require('Root/utils/validators')

const validStyle = {
  background: '#d2f3db'
}

const invalidStyle = {
  background: '#fddede'
}

const getStudentIdCell = (studentId, registration) => {
  if (registration) {
    return (
      <Table.Cell style={validStyle}>
        {`${studentId} (${registration.onro})`}
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

const getGradeCell = (grade) => {
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
  return <Table.Cell style={validStyle}>Hyv.</Table.Cell>
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
  if (isValidOodiDate(date)) {
    return <Table.Cell style={validStyle}>{date}</Table.Cell>
  }
  return (
    <Table.Cell style={invalidStyle}>
      <Icon name="ban" />
      {date}
    </Table.Cell>
  )
}

export default () => {
  const newReport = useSelector((state) => state.newReport)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)

  if (!newReport.data) return null

  const grader = graders.find(
    (g) => g.employeeId === newReport.graderEmployeeId
  )
  const course = courses.find((c) => c.id === newReport.courseId)
  const date = newReport.date ? newReport.date : 'Merkitse suorituspäivämäärä'

  const reportRows = newReport.data.map((row, index) => (
    <Table.Row key={row.studentId + index}>
      {course ? (
        <Table.Cell style={validStyle}>
          {`${course.name} (${course.courseCode})`}
        </Table.Cell>
      ) : (
        <Table.Cell />
      )}
      {getStudentIdCell(row.studentId, row.registration)}
      {getGradeCell(row.grade)}
      {getCreditCell(row.credits, course)}
      {getLanguageCell(row.language, course)}
      {grader ? (
        <Table.Cell style={validStyle}>{grader.name}</Table.Cell>
      ) : (
        <Table.Cell />
      )}
      {getDateCell(row.completionDate || date)}
    </Table.Row>
  ))

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Kurssi</Table.HeaderCell>
          <Table.HeaderCell>Opiskelijanumero</Table.HeaderCell>
          <Table.HeaderCell>Arvosana</Table.HeaderCell>
          <Table.HeaderCell>Laajuus (op)</Table.HeaderCell>
          <Table.HeaderCell>Kieli</Table.HeaderCell>
          <Table.HeaderCell>Arvostelija</Table.HeaderCell>
          <Table.HeaderCell>Arvostelupäivämäärä</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{reportRows}</Table.Body>
    </Table>
  )
}
