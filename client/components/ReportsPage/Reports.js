import React from 'react'
import { useSelector } from 'react-redux'

import { Accordion, Table } from 'semantic-ui-react'

const Downloaded = () => <div style={{ color: 'green' }}>DOWNLOADED</div>
const NotDownloaded = () => <div style={{ color: 'red' }}>NOT DOWNLOADED</div>

const LANGUAGES = { 1: 'fi', 2: 'sv', 6: 'en' }

const reportTable = (report) => {
  const TableBody = () => {
    return (
      <Table.Body>
        {report.data.split('\n').map((rawLine, index) => {
          const line = rawLine.split('#')
          return (
            <Table.Row key={`row-${index}`}>
              <Table.Cell>{line[3]}</Table.Cell>
              <Table.Cell>{line[4]}</Table.Cell>
              <Table.Cell>{line[0]}</Table.Cell>
              <Table.Cell>{line[7]}</Table.Cell>
              <Table.Cell>{line[17]}</Table.Cell>
              <Table.Cell>{LANGUAGES[line[2]]}</Table.Cell>
              <Table.Cell>{line[5]}</Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    )
  }

  return (
    <Accordion.Content>
      <Table celled striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Course code</Table.HeaderCell>
            <Table.HeaderCell>Course name</Table.HeaderCell>
            <Table.HeaderCell>Student number</Table.HeaderCell>
            <Table.HeaderCell>Grade</Table.HeaderCell>
            <Table.HeaderCell>Credits</Table.HeaderCell>
            <Table.HeaderCell>Language</Table.HeaderCell>
            <Table.HeaderCell>Completion date</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <TableBody />
      </Table>
    </Accordion.Content>
  )
}

const title = (report) => {
  const fileName = report.fileName.split('%')
  const timestamp = fileName[1].split('-')
  return (
    <Accordion.Title>
      {`${fileName[0]} - ${timestamp[0]} - ${timestamp[1].substring(
        0,
        2
      )}:${timestamp[1].substring(2, 4)}:${timestamp[1].substring(4, 6)}`}
      {report.lastDownloaded ? <Downloaded /> : <NotDownloaded />}
    </Accordion.Title>
  )
}

export default () => {
  const reports = useSelector((state) => state.reports)

  if (reports.pending) return <div>LOADING!</div>

  const manualReports = reports.data.filter((report) => report.reporterId) // filter out EoAI reports.

  if (manualReports.length === 0) return <div>NO REPORTS FOUND.</div>

  const panels = manualReports.map((r, i) => {
    return {
      key: `panel-${i}`,
      title: title(r),
      content: reportTable(r)
    }
  })

  return <Accordion panels={panels} exclusive={false} fluid styled />
}
