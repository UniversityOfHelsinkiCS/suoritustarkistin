import React from 'react'
import { Table } from 'semantic-ui-react'

const { isValidRow } = require('../../utils/validators')

const parseDataToReport = (report) => {
  const grader = report.graderId ? report.graderId : 'Valitse arvostelija'
  const course = report.courseId ? report.courseId : 'Valitse kurssi'
  const date = report.date ? report.date : 'Merkitse arvostelupäivämäärä'

  console.log('pvm', report.date)

  const splitData = report.data.trim().split('\n')
  const reportRows = splitData.map((row) => {
    const splitRow = row.split(';')
    if (isValidRow(splitRow)) {
      return (
        <Table.Row key={splitRow[0]}>
          <Table.Cell>{course}</Table.Cell>
          <Table.Cell>{splitRow[0]}</Table.Cell>
          <Table.Cell>{splitRow[1] || 'Hyv.'}</Table.Cell>
          <Table.Cell>{splitRow[2] || course.credits}</Table.Cell>
          <Table.Cell>{splitRow[3] || course.language}</Table.Cell>
          <Table.Cell>{grader}</Table.Cell>
          <Table.Cell>{date}</Table.Cell>
        </Table.Row>
      )
    }
    return (
      <Table.Row key={splitRow[0]}>
        <Table.Cell>{course}</Table.Cell>
        <Table.Cell negative>{row}</Table.Cell>
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

export default ({ report }) => <div>{report.data === null ? '' : parseDataToReport(report)}</div>
