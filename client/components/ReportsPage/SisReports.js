import React from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Accordion, Button, Table, Message } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'
import { sisHandleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'

const SentToSis = () => <span style={{ color: 'green' }}>SENT TO SIS</span>
const NotSentToSis = () => <span style={{ color: 'red' }}>NOT SENT TO SIS</span>
const ContainsErrors = ({ amount }) => <span style={{ color: 'orange', marginLeft: '0.5rem' }}>{`CONTAINS ${amount} ERROR(S)`}</span>

const DeleteButton = ({ id }) => {
  const dispatch = useDispatch()
  return (
    <Button data-cy={`sis-report-entry-delete-button-${id}`} color="red" onClick={() => dispatch(sisHandleEntryDeletionAction(id))}>Delete</Button>
  )
}

const CellsIfEntry = ({ entry }) => {
  const { personId, verifierPersonId, courseUnitRealisationId, assessmentItemId, completionDate, completionLanguage } = entry
  
  return (
    <>
      <Table.Cell data-cy={`sis-report-personId-${entry.id}`} style={{ borderLeft: "2px solid gray" }}>
        {personId ? personId : <span style={{ color: 'red'}}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-verifierPersonId-${entry.id}`}>
        {verifierPersonId ? verifierPersonId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-courseUnitRealisationId-${entry.id}`}>
        {courseUnitRealisationId ? courseUnitRealisationId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-assessmentItemId-${entry.id}`}>
        {assessmentItemId ? assessmentItemId : <span style={{ color: 'red' }}>null</span> }
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionDate-${entry.id}`}>
        {completionDate ? completionDate : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
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

const ReportTable = ({ rows, course }) => {
  const TableBody = ({ rawEntries, course }) => <Table.Body data-cy="sis-report-table">
    {rawEntries.map((rawEntry) => {
      return <>
        <Table.Row key={`row-${rawEntry.id}`}>
          <Table.Cell data-cy={`sis-report-course-code-${rawEntry.id}`}>{course.courseCode}</Table.Cell>
          <Table.Cell data-cy={`sis-report-course-name-${rawEntry.id}`}>{course.name}</Table.Cell>
          <Table.Cell data-cy={`sis-report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
          {rawEntry.entry ? <CellsIfEntry entry={rawEntry.entry} /> : <CellsIfNoEntry />}
          <Table.Cell data-cy={`sis-report-grade-${rawEntry.id}`}>{rawEntry.grade}</Table.Cell>
          <Table.Cell><DeleteButton id={rawEntry.id} /></Table.Cell>
        </Table.Row>
        {rawEntry.entry.errors ? <Table.Row key={`row-${rawEntry.id}-2`}>
          <Table.Cell colSpan='11' error>{`Error: ${rawEntry.entry.errors.message}`}</Table.Cell>
        </Table.Row> : null}
      </>
    })}
  </Table.Body>
  const TableColumns = () => <>
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
        <Table.HeaderCell>Employee ID</Table.HeaderCell>
        <Table.HeaderCell>Course ID</Table.HeaderCell>
        <Table.HeaderCell>Course instance ID</Table.HeaderCell>
        <Table.HeaderCell>Completion date</Table.HeaderCell>
        <Table.HeaderCell>Language</Table.HeaderCell>
        <Table.HeaderCell>Grade</Table.HeaderCell>
        <Table.HeaderCell>Delete</Table.HeaderCell>
      </Table.Row>
    </Table.Header></>
  return rows.length ? <Table celled structured>
    <TableColumns />
    <TableBody rawEntries={rows} course={course} />
  </Table> : null
}

const reportContents = (report, courses) => {
  const course = courses.find((c) => report[0].courseId === c.id)
  const allEntriesSent = report.every(({ entry }) => entry.hasSent)
  const reportContainsErrors = report.some(({ entry }) => entry.errors)
  const panels = [{
    key: 'entries-without-errors',
    title: allEntriesSent ? 'Successfully sent entries' : 'Entries to Sisu',
    content: <Accordion.Content>
      <ReportTable
        rows={report.filter(({ entry }) => !entry.errors)}
        course={course} />
    </Accordion.Content>
  }]
  if (allEntriesSent && reportContainsErrors)
    panels.unshift({
      active: true,
      key: 'entries-with-errors',
      title: 'Entries with errors',
      content: <Accordion.Content><ReportTable rows={report.filter(({ entry }) => entry.errors || !entry.hasSent)} course={course} /></Accordion.Content>
    })
  return (
    <Accordion.Content>
      <SendToSisButton
        entries={report
          .filter(({ entry }) => !entry.hasSent || entry.errors)
          .map(({ entry }) => entry.id)
        } />
      {reportContainsErrors ? <Message error>
        <Message.Header>This report contains errors from Sisu</Message.Header>
        <p>See failed rows bellow. Failed entries can be resent to Sisu by clicking send completions to Sisu button.</p>
      </Message> : null}
      {!reportContainsErrors && allEntriesSent ? <Message success>
        <Message.Header>All entries sent successfully to Sisu</Message.Header>
      </Message> : null}
      <Accordion.Accordion data-cy={`sis-entries-panel-${course.courseCode}`} panels={panels} exclusive={false} />
    </Accordion.Content>
  )
}

const title = (batch) => {
  const reportName = batch[0].batchId.split('%')
  const timestamp = reportName[1].split('-')
  const indicationWhetherSentToSis = batch.every(({ entry }) => entry.hasSent)
  const includesErrors = batch.filter(({ entry }) => entry.errors).length
  return (
    <Accordion.Title data-cy={`sis-report-${reportName[0]}`}>
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
  if (manualReports.length === 0) return <div data-cy="sis-no-reports">NO REPORTS FOUND.</div>

  const batchedReports = Object.values(_.groupBy(manualReports, 'batchId'))

  const panels = batchedReports.map((r, i) => {
    return {
      key: `panel-${i}`,
      title: title(r),
      content: reportContents(r, courses)
    }
  })

  return <Accordion panels={panels} exclusive={false} fluid styled />
}