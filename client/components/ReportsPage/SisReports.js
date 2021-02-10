import React, { useState } from 'react'
import moment from 'moment'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Accordion, Button, Icon, Message, Table } from 'semantic-ui-react'
import DeleteBatchButton from './DeleteBatchButton'
import SendToSisButton from './SendToSisButton'
import SisReportStatus from './SisReportStatus'
import { sisHandleEntryDeletionAction, refreshBatchStatus, openReport } from 'Utilities/redux/sisReportsReducer'
import Notification from 'Components/Message'
import './reportStyles.css'
import { EAOI_CODES, EAOI_NAMEMAP } from '../../../utils/validators'


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

const NullCell = ({ text }) => <span style={{ color: 'red' }}>{text || 'null'}</span>

const getSisUnitName = (name, language) => {
  if (!name) return <NullCell />
  if (!name[language]) return name['fi']
  return name[language]
}

const getCourseName = (rawEntry, course) => {
  if (EAOI_CODES.includes(course.courseCode)) {
    return EAOI_NAMEMAP[rawEntry.entry.completionLanguage].name
  }
  return course.name
}

const getCourseCode = (rawEntry, course) => {
  if (EAOI_CODES.includes(course.courseCode)) {
    return EAOI_NAMEMAP[rawEntry.entry.completionLanguage].code
  }
  return course.courseCode
}



const getGrade = (gradeScaleId, gradeId, language) => {
  if (!gradeId || !gradeScaleId || !language) return <NullCell />
  if (gradeScaleId === "sis-0-5") return gradeId
  if (gradeScaleId === "sis-hyl-hyv") {
    const gradeMap = [
      { en: 'Fail', fi: 'Hyl.', sv: 'F' },
      { en: 'Pass', fi: 'Hyv.', sv: 'G' }
    ]
    const grade = gradeMap[gradeId]
    if (!grade) return <NullCell />
    return grade[language]
  }

  return <NullCell />
}

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
    gradeId,
    registered
  } = entry

  return (
    <>
      <Table.Cell
        data-cy={`sis-report-courseUnitRealisationName-${entry.id}`}
        colSpan='2'
        style={{ borderLeft: "2px solid gray" }}
      >
        <Accordion className="sis-report-table-accordion" >
          <Accordion.Title
            active
            onClick={() => setOpen(!open)}
            data-cy={`sis-report-entry-course-${entry.id}`}
          >
            <Icon name={`caret ${open ? 'down' : 'right'}`} />
            {getSisUnitName(courseUnitRealisationName, completionLanguage)}
          </Accordion.Title>
          <Accordion.Content
            data-cy={`sis-report-course-content-${entry.id}`}
            active={open}
            style={{ padding: "0.75em 1em" }}
          >
            <strong>Course unit ID</strong>
            <p>{courseUnitId || <NullCell />}</p>
            <strong>Course unit realisation ID</strong>
            <p>{courseUnitRealisationId || <NullCell />}</p>
            <strong>Assessment item ID</strong>
            <p>{assessmentItemId || <NullCell />}</p>
            <strong>Grader ID</strong>
            <p>{verifierPersonId || <NullCell />}</p>
            <strong>Grade scale of the course</strong>
            <p>{gradeScaleId || <NullCell />}</p>
          </Accordion.Content>
        </Accordion>
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-personId-${entry.id}`}>
        {personId ? personId : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionDate-${entry.id}`}>
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : <NullCell />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-entry-grade-${entry.id}`}>
        {getGrade(gradeScaleId, gradeId, completionLanguage)}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-sent-${entry.id}`}>
        {sent ? moment(sent).format("DD.MM.YYYY") : <NullCell text="Not sent yet" />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-senderName-${entry.id}`}>
        {sender ? sender.name : <NullCell text="Not sent yet" />}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-registered-${entry.id}`}>
        {registered ? <Icon name="checkmark" color="green" /> : <Icon name="close" color="red" />}
      </Table.Cell>
    </>
  )
}

const TableBody = ({ rawEntries, course }) => (
  <Table.Body data-cy="sis-report-table">
    {rawEntries.map((rawEntry) => (
      <React.Fragment key={`row-${rawEntry.id}`}>
        <Table.Row>
          <Table.Cell data-cy={`sis-report-course-code-${rawEntry.id}`}>{getCourseCode(rawEntry, course)}</Table.Cell>
          <Table.Cell data-cy={`sis-report-course-name-${rawEntry.id}`}>{getCourseName(rawEntry, course)}</Table.Cell>
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
        <Table.HeaderCell colSpan='4' />
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
        <Table.HeaderCell>Completion date</Table.HeaderCell>
        <Table.HeaderCell>Language</Table.HeaderCell>
        <Table.HeaderCell>Grade</Table.HeaderCell>
        <Table.HeaderCell>Date sent</Table.HeaderCell>
        <Table.HeaderCell>Sender name</Table.HeaderCell>
        <Table.HeaderCell>In Sisu</Table.HeaderCell>
        <Table.HeaderCell>Delete</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  </>
)

const ReportTable = ({ rows, course }) => (
  rows.length && (
    <Table className="sis-report-table" style={{ padding: "0.em .78em" }}>
      <TableColumns />
      <TableBody key={course.id} rawEntries={rows} course={course} />
    </Table>
  )
)

const reportContents = (report, course, dispatch, user, openAccordions) => {
  if (!report) return null

  const batchSent = report.some(({ entry }) => entry.sent)
  const reportContainsErrors = report.some(({ entry }) => entry.errors)
  const entriesWithoutErrors = report.filter(({ entry }) => !entry.errors)
  const entriesNotSentOrErroneous = report.filter(({ entry }) => entry.errors || !entry.sent)

  const panels = [{
    key: 'entries-without-errors',
    title: 'Successfully sent entries',
    content: (
      <Accordion.Content>
        <ReportTable
          rows={entriesWithoutErrors}
          course={course} />
      </Accordion.Content>
    )
  }]
  if (reportContainsErrors)
    panels.unshift({
      active: true,
      key: 'entries-with-errors',
      title: 'Entries with errors',
      content: (
        <Accordion.Content>
          <ReportTable
            rows={entriesNotSentOrErroneous}
            course={course}
          />
        </Accordion.Content>
      )
    })

  return (
    <Accordion.Content active={openAccordions.includes(report[0].batchId)}>
      <p>Completions reported by <strong>{report[0].reporter ? report[0].reporter.name : "Suotar-bot"}</strong></p>
      {user.adminMode && (
        <>
          <SendToSisButton
            entries={report
              .filter(({ entry }) => !entry.sent || entry.errors)
              .map(({ entry }) => entry.id)
            } />
          <DeleteBatchButton batchId={report[0].batchId} />
          <Button
            onClick={() => dispatch(
              refreshBatchStatus(report.map(({ entry }) => entry.id))
            )}
            disabled={report.every(({ entry }) => !entry.sent)}
            icon
          >
            <Icon name="refresh" /> Refresh from Sisu
          </Button>
        </>
      )}


      {batchSent && !reportContainsErrors && <SisSuccessMessage />}

      { // Display accordion only when batch contains sent entries or entries with errors
        !batchSent && !reportContainsErrors
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
  const [course, date, time] = batch[0].batchId.split('-')

  return (
    <Accordion.Title data-cy={`sis-report-${course}`}>
      {`${course} - ${date} - ${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`}
      <SisReportStatus batch={batch} />
    </Accordion.Title>
  )
}

export default ({ reports, user }) => {
  const courses = useSelector((state) => state.courses.data)
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)
  const dispatch = useDispatch()

  if (reports.pending) return <div>LOADING!</div>
  if (!reports || reports.length === 0) return <div data-cy="sis-no-reports">NO REPORTS FOUND.</div>

  const batchedReports = Object.values(_.groupBy(reports, 'batchId'))
    .sort((a, b) => b[0].createdAt.localeCompare(a[0].createdAt))

  const panels = batchedReports.map((report, index) => {
    
    const reportWithEntries = report.filter((e) => e && e.entry)
    if (!reportWithEntries || !reportWithEntries.length) return null

    const course = courses.find((c) => report[0].courseId === c.id)
    if (!course) return {
      key: `panel-${index}`,
      title: title(reportWithEntries),
      content: <Accordion.Content>Course for these entries was not found from Suotar</Accordion.Content>
    }
  
    return {
      key: `panel-${index}`,
      title: title(reportWithEntries),
      content: reportContents(reportWithEntries, course, dispatch, user, openAccordions),
      onTitleClick: () => dispatch(openReport(reportWithEntries[0].batchId))
    }
  })

  return <>
    <Notification />
    <Accordion panels={panels} exclusive={false} fluid styled />
  </>
}