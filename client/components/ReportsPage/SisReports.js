import React, { useState } from 'react'
import moment from 'moment'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Accordion, Button, Icon, Message, Table } from 'semantic-ui-react'
import SendToSisButton from './SendToSisButton'
import { sisHandleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'
import Notification from 'Components/Message'
import './reportStyles.css'

const SentToSis = ({ senderNames, formattedDate }) => <span>
  <span style={{ color: 'green' }}>SENT TO SIS </span>
  <span style={{ color: 'gray' }}>{formattedDate}, by: {senderNames.join(",")}</span>
</span>

const NotSentToSis = () => <span style={{ color: 'red' }}>NOT SENT TO SIS</span>

const ContainsErrors = ({ amount }) => <div style={{ color: 'orange' }}>{`CONTAINS ${amount} ERROR(S)`}</div>

const SisSuccessMessage = () => <Message success>
  <Message.Header>All entries sent successfully to Sisu</Message.Header>
</Message>

const DeleteButton = ({ id }) => {
  const dispatch = useDispatch()
  return (
    <Button
      data-cy={`sis-report-entry-delete-button-${id}`}
      color="red"
      onClick={() => dispatch(sisHandleEntryDeletionAction(id))}
    >
      Delete
    </Button>
  )
}

const NullCell = ({ text }) => <span style={{ color: 'red'}}>{text || 'null'}</span>

const EntryCells = ({ entry }) => {
  const [open, setOpen] = useState(false)
  const {
    personId,
    verifierPersonId,
    courseUnitRealisationName,
    courseUnitId,
    courseUnitRealisationId,
    assessmentItemId,
    completionDate,
    completionLanguage,
    sent,
    sender,
    gradeScaleId,
    gradeId
  } = entry

  return (
    <>
      <Table.Cell
        data-cy={`sis-report-courseUnitRealisationName-${entry.id}`}
        colSpan='2'
        style={{ borderLeft: "2px solid gray" }}
      >
        <Accordion.Accordion style={{ marginTop: "0px"}}>
          <Accordion.Title
            active
            onClick={() => setOpen(!open)}
            data-cy={`sis-report-entry-course-${entry.id}`}
          >
            <Icon name={`caret ${open ? 'down' : 'right'}`}/>
            {courseUnitRealisationName ? courseUnitRealisationName[completionLanguage] : <NullCell />}
          </Accordion.Title>
          <Accordion.Content
            data-cy={`sis-report-course-content-${entry.id}`}
            active={open}
            style={{ padding: "0.75em 1em"}}
          >
            <strong>Course unit ID</strong>
            <p>{courseUnitId || <NullCell />}</p>
            <strong>Course unit realisation ID</strong>
            <p>{courseUnitRealisationId || <NullCell />}</p>
            <strong>Assessment item ID</strong>
            <p>{assessmentItemId || <NullCell />}</p>
            <strong>Grade scale of the course</strong>
            <p>{gradeScaleId || <NullCell />}</p>
          </Accordion.Content>
        </Accordion.Accordion>
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-personId-${entry.id}`}>
        {personId ? personId : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-verifierPersonId-${entry.id}`}>
        {verifierPersonId ? verifierPersonId : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionDate-${entry.id}`}>
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-entry-grade-${entry.id}`}>
        {gradeId ? gradeId : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-sent-${entry.id}`}>
        {sent ? moment(sent).format("DD.MM.YYYY") : <NullCell text="Not sent yet"/>}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-senderName-${entry.id}`}>
        {sender ? sender.name : <NullCell text="Not sent yet"/>}
      </Table.Cell>
    </>
  )
}

const TableBody = ({ rawEntries, course }) => (
  <Table.Body data-cy="sis-report-table">
    {rawEntries.map((rawEntry) => (
      <React.Fragment key={`row-${rawEntry.id}`}>
        <Table.Row>
          <Table.Cell data-cy={`sis-report-course-code-${rawEntry.id}`}>
            {rawEntry.isOpenUni ? `AY${course.courseCode}` : course.courseCode}</Table.Cell>
          <Table.Cell data-cy={`sis-report-course-name-${rawEntry.id}`}>{course.name}</Table.Cell>
          <Table.Cell data-cy={`sis-report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
          <Table.Cell data-cy={`sis-report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
          <EntryCells entry={rawEntry.entry} />
          <Table.Cell>
            <DeleteButton id={rawEntry.id} />
          </Table.Cell>
        </Table.Row>
        {rawEntry.entry.errors &&
          <Table.Row>
            <Table.Cell
              colSpan='15'
              error>{`Errors from SIS: ${rawEntry.entry.errors.message}`}
            </Table.Cell>
          </Table.Row>}
      </React.Fragment>
    ))}
  </Table.Body>
)

const TableColumns = () => (
  <>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan='4'>Manually inserted</Table.HeaderCell>
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
        <Table.HeaderCell>Student number</Table.HeaderCell>
        <Table.HeaderCell>Credits</Table.HeaderCell>
        <Table.HeaderCell
          style={{ borderLeft: "2px solid gray" }}
          colSpan='2'
        >
          Course Unit
        </Table.HeaderCell>
        <Table.HeaderCell>Student ID</Table.HeaderCell>
        <Table.HeaderCell>Grader ID</Table.HeaderCell>
        <Table.HeaderCell>Completion date</Table.HeaderCell>
        <Table.HeaderCell>Language</Table.HeaderCell>
        <Table.HeaderCell>Grade</Table.HeaderCell>
        <Table.HeaderCell>Date sent</Table.HeaderCell>
        <Table.HeaderCell>Sender name</Table.HeaderCell>
        <Table.HeaderCell>Delete</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  </>
)

const ReportTable = ({ rows, course }) => (
  rows.length && (
    <Table className="sis-report-table" style={{ padding: "0.em .78em"}}>
      <TableColumns />
      <TableBody key={course.id} rawEntries={rows} course={course} />
    </Table>
  )
)

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
      content: (
        <Accordion.Content>
          <ReportTable
            rows={report.filter(({ entry }) => entry.errors || !entry.sent)}
            course={course}
          />
        </Accordion.Content>
      )
    })

  return (
    <Accordion.Content>
      <p>Batch reported by <strong>{report[0].reporter ? report[0].reporter.name : "Suotar-bot"}</strong></p>
      <SendToSisButton
        entries={report
          .filter(({ entry }) => !entry.sent || entry.errors)
          .map(({ entry }) => entry.id)
        } />

      {!batchNotSent && !reportContainsErrors && <SisSuccessMessage />}

      { // Display accordion only when batch contains sent entries or entries with errors
        batchNotSent && !reportContainsErrors
          ? <ReportTable
              rows={report}
              course={course}
            />
          : <Accordion.Accordion
              data-cy={`sis-entries-panel-${course.courseCode}`}
              panels={panels}
              exclusive={false}
            />
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

export default ({ reports }) => {
  const courses = useSelector((state) => state.courses.data)

  if (reports.pending) return <div>LOADING!</div>
  if (!reports || reports.length === 0) return <div data-cy="sis-no-reports">NO REPORTS FOUND.</div>

  const batchedReports = Object.values(_.groupBy(reports, 'batchId'))

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