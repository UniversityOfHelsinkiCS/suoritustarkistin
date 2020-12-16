import React from 'react'
import { useSelector } from 'react-redux'
import { Accordion, Table } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'

const SentToSis = () => <div style={{ color: 'green' }}>SENT TO SIS</div>
const NotSentToSis = () => <div style={{ color: 'red' }}>NOT SENT TO SIS</div>

const reportTable = (report) => {
  const TableBody = () => {
    return (
      <Table.Body>
        {report.data.split('\n').map((rawLine, index) => {
          const line = rawLine.split('#')
          return (
            <Table.Row key={`row-${index}`}>
              <Table.Cell>{line[0]}</Table.Cell>
              <Table.Cell>{line[1]}</Table.Cell>
              <Table.Cell>{line[2]}</Table.Cell>
              <Table.Cell style={{ borderLeft: "2px solid gray" }}>{line[3]}</Table.Cell>
              <Table.Cell>{line[4]}</Table.Cell>
              <Table.Cell>{line[5]}</Table.Cell>
              <Table.Cell>{line[6]}</Table.Cell>
              <Table.Cell>{line[7]}</Table.Cell>
              <Table.Cell>{line[8]}</Table.Cell>
              <Table.Cell>{line[9]}</Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    )
  }

  return (
    <Accordion.Content>
      <SendToSisButton />
      <Table celled striped structured>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan='3'>Basics</Table.HeaderCell>
            <Table.HeaderCell 
              colSpan='7'
              style={{ borderLeft: "2px solid gray" }}
            >
              Going to SIS
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Course code</Table.HeaderCell>
            <Table.HeaderCell>Course name</Table.HeaderCell>
            <Table.HeaderCell>Student number</Table.HeaderCell>
            <Table.HeaderCell
              style={{ borderLeft: "2px solid gray" }}
            >
              Student ID
            </Table.HeaderCell>
            <Table.HeaderCell>Empoyee ID</Table.HeaderCell>
            <Table.HeaderCell>Course ID</Table.HeaderCell>
            <Table.HeaderCell>Course instance ID</Table.HeaderCell>
            <Table.HeaderCell>Completion date</Table.HeaderCell>
            <Table.HeaderCell>Language</Table.HeaderCell>
            <Table.HeaderCell>Grade</Table.HeaderCell>
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
      {report.lastDownloaded ? <SentToSis /> : <NotSentToSis />}
    </Accordion.Title>
  )
}

export default () => {
  const reports = useSelector((state) => state.sisReports)

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
