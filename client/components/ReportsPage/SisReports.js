import React from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Accordion, Button, Table, Message } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'
import { sisHandleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'
import moment from 'moment'
import Notification from 'Components/Message'

const SentToSis = ({ senderNames, formattedDate }) => <span>
  <span style={{ color: 'green' }}>SENT TO SIS </span>
  <span style={{ color: 'gray' }}>{formattedDate}, by: {senderNames.join(",")}</span>
</span>
const NotSentToSis = () => <span style={{ color: 'red' }}>NOT SENT TO SIS</span>
const ContainsErrors = ({ amount }) => <div style={{ color: 'orange' }}>{`CONTAINS ${amount} ERROR(S)`}</div>

const SisErrorsMessage = () => <Message error>
  <Message.Header>This report contains errors from Sisu</Message.Header>
  <p>See failed rows bellow. Failed entries can be resent to Sisu by clicking send completions to Sisu button.</p>
</Message>
const SisSuccessMessage = () => <Message success>
  <Message.Header>All entries sent successfully to Sisu</Message.Header>
</Message>

const DeleteButton = ({ id }) => {
  const dispatch = useDispatch()
  return (
    <Button data-cy={`sis-report-entry-delete-button-${id}`} color="red" onClick={() => dispatch(sisHandleEntryDeletionAction(id))}>Delete</Button>
  )
}

const CellsIfEntry = ({ entry }) => {
  const { personId, verifierPersonId, courseUnitId, courseUnitRealisationId, assessmentItemId, completionDate, completionLanguage, sent, sender, gradeScaleId, gradeId  } = entry
  return (
    <>
      <Table.Cell data-cy={`sis-report-personId-${entry.id}`} style={{ borderLeft: "2px solid gray" }}>
        {personId ? personId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-verifierPersonId-${entry.id}`}>
        {verifierPersonId ? verifierPersonId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-courseUnitId-${entry.id}`}>
        {courseUnitId ? courseUnitId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-courseUnitRealisationId-${entry.id}`}>
        {courseUnitRealisationId ? courseUnitRealisationId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-assessmentItemId-${entry.id}`}>
        {assessmentItemId ? assessmentItemId : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionDate-${entry.id}`}>
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-gradeAndScale-${entry.id}`}>
        {gradeId && gradeScaleId ? `${gradeId}, ${gradeScaleId}` : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-sent-${entry.id}`}>
        {sent ? moment(sent).format("DD.MM.YYYY") : <span style={{ color: 'red' }}>null</span>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-senderName-${entry.id}`}>
        {sender ? sender.name : <span style={{ color: 'red' }}>null</span>}
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
          <Table.Cell data-cy={`sis-report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
          <Table.Cell data-cy={`sis-report-grade-${rawEntry.id}`}>{rawEntry.grade}</Table.Cell>
          <Table.Cell data-cy={`sis-report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
          {rawEntry.entry ? <CellsIfEntry entry={rawEntry.entry} /> : <CellsIfNoEntry />}
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
        <Table.HeaderCell colSpan='5'>Basics</Table.HeaderCell>
        <Table.HeaderCell
          colSpan='11'
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
        <Table.HeaderCell>Credits</Table.HeaderCell>
        <Table.HeaderCell>Grade</Table.HeaderCell>
        <Table.HeaderCell>Student number</Table.HeaderCell>
        <Table.HeaderCell
          style={{ borderLeft: "2px solid gray" }}
        >
          Student ID
        </Table.HeaderCell>
        <Table.HeaderCell>Employee ID</Table.HeaderCell>
        <Table.HeaderCell>Course unit</Table.HeaderCell>
        <Table.HeaderCell>Course unit realisation</Table.HeaderCell>
        <Table.HeaderCell>Assessment item</Table.HeaderCell>
        <Table.HeaderCell>Completion date</Table.HeaderCell>
        <Table.HeaderCell>Language</Table.HeaderCell>
        <Table.HeaderCell>Grade and scale</Table.HeaderCell>
        <Table.HeaderCell>Date sent</Table.HeaderCell>
        <Table.HeaderCell>Sender name</Table.HeaderCell>
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
  const batchNotSent = report.every(({ entry }) => !entry.sent)
  const reportContainsErrors = report.some(({ entry }) => entry.errors)
  const panels = [{
    key: 'entries-without-errors',
    title: 'Successfully sent entries',
    content: <Accordion.Content>
      <ReportTable
        rows={report.filter(({ entry }) => !entry.errors)}
        course={course} />
    </Accordion.Content>
  }]
  if (reportContainsErrors)
    panels.unshift({
      active: true,
      key: 'entries-with-errors',
      title: 'Entries with errors',
      content: <Accordion.Content><ReportTable rows={report.filter(({ entry }) => entry.errors || !entry.sent)} course={course} /></Accordion.Content>
    })

  return (
    <Accordion.Content>
      <p>Batch reported by {report[0].reporter.name}</p>
      <SendToSisButton
        entries={report
          .filter(({ entry }) => !entry.sent || entry.errors)
          .map(({ entry }) => entry.id)
        } />

      {reportContainsErrors ? <SisErrorsMessage /> : null}
      {!batchNotSent && !reportContainsErrors ? <SisSuccessMessage /> : null}

      { // Display accordion only when batch contains sent entries or entries with errors
        batchNotSent && !reportContainsErrors
          ? <ReportTable
            rows={report}
            course={course} />
          : <Accordion.Accordion data-cy={`sis-entries-panel-${course.courseCode}`} panels={panels} exclusive={false} />
      }
    </Accordion.Content>
  )
}

const title = (batch) => {
  const reportName = batch[0].batchId.split('%')
  const timestamp = reportName[1].split('-')
  const hasSuccessfullySentEntries = batch.some(({entry}) => !entry.errors && entry.sent)
  const batchSenders = batch.filter(({ entry }) => entry.sender).map(({ entry }) => entry.sender.name)
  const sentDate = batch.filter(({ entry }) => entry.sent).sort((a, b) => new Date(b.entry.sent) - new Date(a.entry.sent))[0] || null
  const includesErrors = batch.filter(({ entry }) => entry.errors).length
  return (
    <Accordion.Title data-cy={`sis-report-${reportName[0]}`}>
      {`${reportName[0]} - ${timestamp[0]} - ${timestamp[1].substring(0, 2)
        }:${timestamp[1].substring(2, 4)}:${timestamp[1].substring(4, 6)}`}
      <div>
        {hasSuccessfullySentEntries ? <SentToSis senderNames={batchSenders} formattedDate={moment(sentDate).format("DD.MM.YYYY")} /> : <NotSentToSis />}
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

  return <>
    <Notification />
    <Accordion panels={panels} exclusive={false} fluid styled />
  </>
}