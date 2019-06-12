import React from 'react'
import { Table } from 'semantic-ui-react'

const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
} = require('../../util/validators')

const LANGUAGES = {
  fi: 1,
  en: 6,
}

// to be replaced with user input
const grader = { name: 'Jami Kousa', identityCode: 'jakousa' }
const course = {
  credits: '3,0',
  name: 'Devops with Docker',
  courseCode: 'DOPS',
  language: 'en',
}
const date = '1.1.1900'
const auth = 'lolskis'

const isValidRow = (row) => {
  if (!isValidStudentId(row[0])) {
    return false
  }
  if (row[1] && !isValidGrade(row[1])) {
    return false
  }
  if (row[2] && !isValidCreditAmount(row[2])) {
    return false
  }
  if (row[3] && !LANGUAGES[row[3]]) {
    return false
  }
  return true
}

const parseDataToReport = (data) => {
  const splitData = data.trim().split('\n')
  const reportRows = splitData.map((row) => {
    const splitRow = row.split(';')
    if (isValidRow(splitRow)) {
      return (
        <Table.Row key={splitRow[0]}>
          <Table.Cell>{course.name}</Table.Cell>
          <Table.Cell>{splitRow[0]}</Table.Cell>
          <Table.Cell>{splitRow[1] || 'Hyv.'}</Table.Cell>
          <Table.Cell>{splitRow[2] || course.credits}</Table.Cell>
          <Table.Cell>{splitRow[3] || course.language}</Table.Cell>
          <Table.Cell>{grader.name}</Table.Cell>
          <Table.Cell>{date}</Table.Cell>
        </Table.Row>
      )
    }
    throw new Error(`Validation error in row "${row}"`)
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

export default ({ report }) => (
  <div>{report.data === '' ? report.data : parseDataToReport(report.data)}</div>
)
