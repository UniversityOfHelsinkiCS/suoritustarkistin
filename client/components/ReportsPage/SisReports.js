import React, { useEffect, useState } from 'react'
import moment from 'moment'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Accordion, Button, Icon, Message, Table, Radio } from 'semantic-ui-react'
import DeleteBatchButton from './DeleteBatchButton'
import SendToSisButton from './SendToSisButton'
import SisReportStatus from './SisReportStatus'
import { sisHandleEntryDeletionAction, refreshBatchStatus, openReport } from 'Utilities/redux/sisReportsReducer'
import sisuErrorMessages from 'Utilities/sisuErrorMessages.json'
import Notification from 'Components/Message'
import './reportStyles.css'
import { EOAI_CODES, EOAI_NAMEMAP } from '../../../utils/validators'


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

const getSisUnitName = (name, language) => {
  try {
    const parsed = JSON.parse(name)
    if (!parsed) return <span style={{ color: '#573a08' }}>Enrolment missing</span>
    if (!parsed[language]) return parsed['fi']
    return parsed[language]
  } catch {
    return name
  }
}

const getCourseName = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].name
  }
  return course.name
}

const getCourseCode = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].code
  }
  return course.courseCode
}

const getCourseUnitRealisationSisuUrl = (realisation) => `
  https://sis-helsinki${process.env.NODE_ENV === 'staging' ? '-test' : ''}.funidata.fi
/teacher/role/staff/teaching/course-unit-realisations/view/${realisation}/attainments/list
`

const getGrade = (gradeScaleId, gradeId, language) => {
  if (!gradeId || !gradeScaleId || !language) return null
  if (gradeScaleId === "sis-0-5") return gradeId
  if (gradeScaleId === "sis-hyl-hyv") {
    const gradeMap = [
      { en: 'Fail', fi: 'Hyl.', sv: 'F' },
      { en: 'Pass', fi: 'Hyv.', sv: 'G' }
    ]
    const grade = gradeMap[gradeId]
    if (!grade) return null
    return grade[language]
  }

  return null
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
            <p>{courseUnitId || null}</p>
            <strong>Course unit realisation ID</strong>
            <p>{courseUnitRealisationId || null}</p>
            <strong>Assessment item ID</strong>
            <p>{assessmentItemId || null}</p>
            <strong>Grader ID</strong>
            <p>{verifierPersonId || null}</p>
            <strong>Grade scale of the course</strong>
            <p>{gradeScaleId || null}</p>
          </Accordion.Content>
        </Accordion>
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-personId-${entry.id}`}>
        {personId ? personId : null}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionDate-${entry.id}`}>
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : null}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-entry-grade-${entry.id}`}>
        {getGrade(gradeScaleId, gradeId, completionLanguage)}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-sent-${entry.id}`}>
        {sent ? moment(sent).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-senderName-${entry.id}`}>
        {sender ? sender.name : null}
      </Table.Cell>
      <Table.Cell data-cy={`sis-report-registered-${entry.id}`}>
        {registered ? <Icon name="checkmark" color="green" /> : <Icon name="close" color="red" />}
      </Table.Cell>
    </>
  )
}

const parseEntryError = ({ message: error }) => {
  try {
    const { messageTemplate, message, path } = error
    if (!sisuErrorMessages[messageTemplate] || !path)
      return message
    return `${sisuErrorMessages[messageTemplate]} in attribute ${path.split(".")[2]}`
  } catch (e) {
    return 'Click to view full error'
  }
}

const MinimalExpand = ({ title, content }) => {
  const [open, setOpen] = useState(false)
  return <>
    <span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>{title} <Icon name={`triangle ${open ? 'down' : 'right'}`} /></span>
    {open ? <p>{content}</p> : null}
  </>
}

const TableBody = ({ rawEntries, course }) => (
  <Table.Body data-cy="sis-report-table">
    {rawEntries.map((rawEntry) => (
      <React.Fragment key={`row-${rawEntry.id}`}>
        <Table.Row warning={rawEntry.entry.missingEnrolment}>
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
              error>
              <MinimalExpand title={parseEntryError(rawEntry.entry.errors)} content={`Full error: ${JSON.stringify(rawEntry.entry.errors)}`} />
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
      <TableBody key={rows[0].batchId} rawEntries={rows} course={course} />
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
      <p>Completions reported by <strong>{(!report[0].reporter || report[0].batchId.startsWith("limbo")) ? "Suotar-bot" : report[0].reporter.name}</strong></p>
      {report[0].batchId.startsWith("limbo")
        ? <Message info>
          <p>This report contains previously reported entries for which an enrollment has been found.</p>
        </Message>
        : null}
      {user.adminMode && (
        <>
          <SendToSisButton
            entries={report
              .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
              .map(({ entry }) => entry.id)
            } />
          <DeleteBatchButton batchId={report[0].batchId} />
          {!report[0].batchId.startsWith("limbo") ? <a href={getCourseUnitRealisationSisuUrl(report[0].entry.courseUnitRealisationId)} target="_blank" rel="noopener noreferrer">
            <Button icon>
              <Icon name="external" /> View attainments in Sisu
            </Button>
          </a> : null}
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
  const titleString = batch[0].batchId.startsWith("limbo")
    ? batch[0].batchId
    : `${course} - ${date} - ${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`
  return (
    <Accordion.Title data-cy={`sis-report-${course}`}>
      {titleString}
      <SisReportStatus batch={batch} />
    </Accordion.Title>
  )
}

export default withRouter(({ reports, user, match }) => {
  const [loading, setLoading] = useState(true)
  const courses = useSelector((state) => state.courses.data)
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)
  const [filters, setFilters] = useState({ errors: false, missing: false, notSent: false })
  const dispatch = useDispatch()

  useEffect(() => {
    if (match && reports.length) {
      const { activeBatch } = match.params
      if (activeBatch && loading) {
        dispatch(openReport(activeBatch))
        setLoading(false)
      }
    }
  }, [match, reports])

  if (!reports || reports.length === 0) return <div data-cy="sis-no-reports">NO REPORTS FOUND.</div>

  const batchedReports = Object.values(_.groupBy(reports, 'batchId'))
    .sort((a, b) => b[0].createdAt.localeCompare(a[0].createdAt))

  const filterBatches = (report) => {
    if (!filters.errors && !filters.missing && !filters.notSent) return true

    const containsErrors = report.some(({ entry }) => (entry.errors || {}).message)
    const notSent = report.every(({ entry }) => !entry.sent)
    const missingFromSisu = report.some(({ entry }) => entry.sent && !(entry.errors || {}).message && !entry.registered)
    if (filters.errors && containsErrors) return true
    if (filters.missing && missingFromSisu) return true
    if (filters.notSent && notSent) return true
    return false
  }

  const placeholderCourse = {
    id: 'COURSE DELETED',
    name: 'COURSE DELETED',
    courseCode: 'COURSE DELETED',
    language: 'COURSE DELETED',
    credits: 'COURSE DELETED'
  }

  const panels = batchedReports
    .filter(filterBatches)
    .map((report, index) => {
      const reportWithEntries = report
        .filter((e) => e && e.entry)
        .sort((a, b) => a.entry.missingEnrolment - b.entry.missingEnrolment)
      if (!reportWithEntries || !reportWithEntries.length) return null

      const course = courses.find((c) => report[0].courseId === c.id) || placeholderCourse

      return {
        key: `panel-${index}`,
        title: title(reportWithEntries),
        content: reportContents(reportWithEntries, course, dispatch, user, openAccordions),
        onTitleClick: () => dispatch(openReport(reportWithEntries[0].batchId))
      }
    })

  const toggleFilter = (name) => setFilters({ ...filters, [name]: !filters[name] })

  const Filters = () => <div style={{ marginBottom: '2rem' }}>
    <h3>View reports with:</h3>
    <Radio label='Contains errors' style={{ margin: '0 1rem' }} checked={filters.errors} onClick={() => toggleFilter('errors')} toggle />
    <Radio label='Sent missing from Sisu' style={{ margin: '0 1rem' }} checked={filters.missing} onClick={() => toggleFilter('missing')} toggle />
    <Radio label='Not sent to Sisu' style={{ margin: '0 1rem' }} checked={filters.notSent} onClick={() => toggleFilter('notSent')} toggle />
  </div>

  return <>
    <Notification />
    <Filters />
    <Accordion panels={panels} exclusive={false} fluid styled />
  </>
})
