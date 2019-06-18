import React from 'react'
import { Table } from 'semantic-ui-react'

const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage
} = require('../../utils/validators')

const validStyle = {
  background: '#d2f3db'
}

const invalidStyle = {
  background: '#fddede'
}

const getStudentIdCell = (studentId) => {
  if (isValidStudentId(studentId)) {
    return <Table.Cell style={validStyle}>{studentId}</Table.Cell>
  } else {
    return (
      <Table.Cell style={invalidStyle}>
        <i class="icon ban" /> {studentId}
      </Table.Cell>
    )
  }
}

const getGradeCell = (grade) => {
  if (grade) {
    if (isValidGrade(grade)) {
      return <Table.Cell style={validStyle}>{grade}</Table.Cell>
    } else {
      return (
        <Table.Cell style={invalidStyle}>
          <i class="icon ban" /> {grade}
        </Table.Cell>
      )
    }
  } else {
    return <Table.Cell style={validStyle}>Hyv.</Table.Cell>
  }
}

const getCreditCell = (credits, course) => {
  if (credits) {
    if (isValidCreditAmount(credits)) {
      return <Table.Cell style={validStyle}>{credits}</Table.Cell>
    } else {
      return (
        <Table.Cell style={invalidStyle}>
          <i class="icon ban" /> {credits}
        </Table.Cell>
      )
    }
  } else {
    if (course) {
      return <Table.Cell style={validStyle}>{course.credits}</Table.Cell>
    } else {
      return <Table.Cell />
    }
  }
}

const getLanguageCell = (language, course) => {
  if (language) {
    if (isValidLanguage(language)) {
      return <Table.Cell style={validStyle}>{language}</Table.Cell>
    } else {
      return (
        <Table.Cell style={invalidStyle}>
          <i class="icon ban" /> {language}
        </Table.Cell>
      )
    }
  } else {
    if (course) {
      return <Table.Cell style={validStyle}>{course.language}</Table.Cell>
    } else {
      return <Table.Cell />
    }
  }
}

const getDateCell = (date) => {
  if (isValidOodiDate(date)) {
    return <Table.Cell style={validStyle}>{date}</Table.Cell>
  } else {
    return (
      <Table.Cell style={invalidStyle}>
        <i class="icon ban" /> {date}
      </Table.Cell>
    )
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
          <Table.Cell style={validStyle}>{`${course.name} (${
            course.courseCode
          })`}</Table.Cell>
        ) : (
          <Table.Cell />
        )}
        {getStudentIdCell(row.studentId)}
        {getGradeCell(row.grade)}
        {getCreditCell(row.credits, course)}
        {getLanguageCell(row.language, course)}
        {grader ? (
          <Table.Cell style={validStyle}>{grader.name}</Table.Cell>
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
