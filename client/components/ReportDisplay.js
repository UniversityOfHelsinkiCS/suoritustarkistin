import React from 'react'
import { Table } from 'semantic-ui-react'

const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage
} = require('../../utils/validators')

const getStudentIdCell = (studentId) => {
  if (isValidStudentId(studentId)) {
    return <Table.Cell positive>{studentId}</Table.Cell>
  } else {
    return <Table.Cell negative>{studentId}</Table.Cell>
  }
}

const getGradeCell = (grade) => {
  if (grade) {
    if (isValidGrade(grade)) {
      return <Table.Cell positive>{grade}</Table.Cell>
    } else {
      return <Table.Cell negative>{grade}</Table.Cell>
    }
  } else {
    return <Table.Cell positive>Hyv.</Table.Cell>
  }
}

const getCreditCell = (credits, course) => {
  if (credits) {
    if (isValidCreditAmount(credits)) {
      return <Table.Cell positive>{credits}</Table.Cell>
    } else {
      return <Table.Cell negative>{credits}</Table.Cell>
    }
  } else {
    if (course) {
      return <Table.Cell positive>{course.credits}</Table.Cell>
    } else {
      return <Table.Cell />
    }
  }
}

const getLanguageCell = (language, course) => {
  if (language) {
    if (isValidLanguage(language)) {
      return <Table.Cell positive>{language}</Table.Cell>
    } else {
      return <Table.Cell negative>{language}</Table.Cell>
    }
  } else {
    if (course) {
      return <Table.Cell positive>{course.language}</Table.Cell>
    } else {
      return <Table.Cell />
    }
  }
}

const getDateCell = (date) => {
  if (isValidOodiDate(date)) {
    return <Table.Cell positive>{date}</Table.Cell>
  } else {
    return <Table.Cell negative>{date}</Table.Cell>
  }
}

const parseDataToReport = (report, graders, courses) => {
  const grader = graders.find((g) => g.id === report.graderId)
  const course = courses.find((c) => c.id === report.courseId)
  const date = report.date ? report.date : 'Merkitse arvostelupäivämäärä'

  const reportRows = report.data.map((row) => {
    return (
      <Table.Row key={row.studentId}>
        {course ? (
          <Table.Cell positive>{course.courseCode}</Table.Cell>
        ) : (
          <Table.Cell />
        )}
        {getStudentIdCell(row.studentId)}
        {getGradeCell(row.grade)}
        {getCreditCell(row.credits, course)}
        {getLanguageCell(row.language, course)}
        {grader ? (
          <Table.Cell positive>{grader.name}</Table.Cell>
        ) : (
          <Table.Cell />
        )}
        {getDateCell(date)}
      </Table.Row>
    )
  })

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

export default ({ report, graders, courses }) => (
  <div>
    {report.data === null ? '' : parseDataToReport(report, graders, courses)}
  </div>
)
