import React from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Accordion, Button, Table } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'
import { sisHandleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'

const SentToSis = () => <span style={{ color: 'green' }}>SENT TO SIS</span>
const NotSentToSis = () => <span style={{ color: 'red' }}>NOT SENT TO SIS</span>
const ContainsErrors = ({ amount }) => <span style={{ color: 'orange', marginLeft: '0.5rem' }}>{`CONTAINS ${amount} ERROR(S)`}</span>

const DeleteButton = ({ id }) => {
  const dispatch = useDispatch()
  return (
    <Button color="red" onClick={() => dispatch(sisHandleEntryDeletionAction(id))}>Delete</Button>
  )
}

const CellsIfEntry = ({ entry }) => {
  const { personId, verifierPersonId, courseUnitRealisationId, assessmentItemId, completionDate, completionLanguage } = entry

  return (
    <>
      <Table.Cell style={{ borderLeft: "2px solid gray" }}>
        {personId ? personId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell>{verifierPersonId ? personId : <span style={{ color: 'red' }}>null</span>}</Table.Cell>
      <Table.Cell>{courseUnitRealisationId ? courseUnitRealisationId : <span style={{ color: 'red' }}>null</span>}</Table.Cell>
      <Table.Cell>{assessmentItemId ? assessmentItemId : <span style={{ color: 'red' }}>null</span>}</Table.Cell>
      <Table.Cell>{completionDate ? completionDate : <span style={{ color: 'red' }}>null</span>}</Table.Cell>
      <Table.Cell>{completionLanguage ? completionLanguage : <span style={{ color: 'red' }}>null</span>}</Table.Cell>
    </>
  )
}

const CellsIfNoEntry = () => (
  <>
    <Table.Cell style={{ borderLeft: "2px solid gray", color: "red" }}>null</Table.Cell>
    <Table.Cell style={{ color: "red" }}>null</Table.Cell>
    <Table.Cell style={{ color: "red" }}>null</Table.Cell>
    <Table.Cell style={{ color: "red" }}>null</Table.Cell>
    <Table.Cell style={{ color: "red" }}>null</Table.Cell>
    <Table.Cell style={{ color: "red" }}>null</Table.Cell>
  </>
)

const reportTable = (report, course) => {
  const TableBody = () => {
    return (
      <Table.Body>
        {report.map((rawEntry, index) => {
          return (
            <Table.Row key={`row-${index}`}>
              <Table.Cell>{course.name}</Table.Cell>
              <Table.Cell>{course.courseCode}</Table.Cell>
              <Table.Cell>{rawEntry.studentNumber}</Table.Cell>
              {rawEntry.entry ? <CellsIfEntry entry={rawEntry.entry} /> : <CellsIfNoEntry />}
              <Table.Cell>{rawEntry.grade}</Table.Cell>
              <Table.Cell><DeleteButton id={rawEntry.id} /></Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    )
  }

  return (
    <Accordion.Content>
      <SendToSisButton
        entries={report
          .filter(({entry}) => !entry.hasSent)
          .map(({id}) => id)
        } />
      <Table celled striped structured>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan='3'>Basics</Table.HeaderCell>
            <Table.HeaderCell
              colSpan='8'
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
            <Table.HeaderCell>Delete</Table.HeaderCell>
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
  const indicationWhetherSentToSis = batch.every(({ entry }) => entry.hasSent)
  const includesErrors = batch.filter(({ entry }) => entry.errors).length
  return (
    <Accordion.Title>
      {`${reportName[0]} - ${timestamp[0]} - ${timestamp[1].substring(0, 2)
        }:${timestamp[1].substring(2, 4)}:${timestamp[1].substring(4, 6)}`}
      <div>
        {indicationWhetherSentToSis ? <SentToSis /> : <NotSentToSis />}
        {includesErrors ? <ContainsErrors amount={includesErrors} /> : null}
      </div>
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
