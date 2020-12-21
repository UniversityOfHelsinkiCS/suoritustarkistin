import React from 'react'
import * as _ from 'lodash'
import { useSelector } from 'react-redux'
import { Accordion, Table } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'

const SentToSis = () => <div style={{ color: 'green' }}>SENT TO SIS</div>
const NotSentToSis = () => <div style={{ color: 'red' }}>NOT SENT TO SIS</div>

const reportTable = (report, course) => {
  const TableBody = () => {
    return (
      <Table.Body>
        {report.map((entry, index) => {
          return (
            <Table.Row key={`row-${index}`}>
              <Table.Cell>{course.name}</Table.Cell>
              <Table.Cell>{course.courseCode}</Table.Cell>
              <Table.Cell>{entry.studentNumber}</Table.Cell>
              <Table.Cell style={{ borderLeft: "2px solid gray" }}>
                To be filled with SIS-data
              </Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
              <Table.Cell>To be filled with SIS-data</Table.Cell>
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

const title = (batch) => {
  const reportName = batch[0].batchId.split('%')
  const timestamp = reportName[1].split('-')
  const indicationWhetherSentToSis = false
  return (
    <Accordion.Title>
      {`${reportName[0]} - ${timestamp[0]} - ${timestamp[1].substring(
        0,
        2
      )}:${timestamp[1].substring(2, 4)}:${timestamp[1].substring(4, 6)}`}
    {indicationWhetherSentToSis ? <SentToSis /> : <NotSentToSis />}
    </Accordion.Title>
  )
}

export default () => {
  const reports = useSelector((state) => state.sisReports)
  const courses = useSelector((state) => state.courses.data)

  if (reports.pending) return <div>LOADING!</div>

  const manualReports = reports.data.filter((report) => report.reporterId) // filter out EoAI reports.
  if (manualReports.length === 0) return <div>NO REPORTS FOUND.</div>

  const course = courses.find((c) => manualReports[0].courseId === c.id)

  const batchedReports = Object.values(_.groupBy(manualReports, 'batchId'))

  const panels = batchedReports.map((r, i) => {
    return {
      key: `panel-${i}`,
      title: title(r),
      content: reportTable(r, course)
    }
  })

  return <Accordion panels={panels} exclusive={false} fluid styled />
}
