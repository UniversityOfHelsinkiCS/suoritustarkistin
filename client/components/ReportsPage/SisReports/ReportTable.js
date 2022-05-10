import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Accordion, Icon, Popup, Table } from 'semantic-ui-react'
import moment from 'moment'

import { EOAI_CODES, EOAI_NAMEMAP } from 'Root/utils/common'
import sisuErrorMessages from 'Utilities/sisuErrorMessages.json'
import DeleteEntryButton from './DeleteEntryButton'


const PLACEHOLDER_COURSE = {
  id: 'COURSE DELETED',
  name: 'COURSE DELETED',
  courseCode: 'COURSE DELETED',
  language: 'COURSE DELETED',
  credits: 'COURSE DELETED'
}

const styles = {
  extraEntry: { backgroundColor: '#F8FCFF' }
}

const allowDelete = ({ isAdmin, id: userId }, rawEntry) => {
  const { entry, graderId } = rawEntry
  if (entry.sent) return false
  if (isAdmin) return true
  if (graderId === userId && entry.missingEnrolment) return true
  return false
}

export default ({ rows }) => {
  const user = useSelector((state) => state.user.data)

  if (!rows.length)
    return null

  const includeDelete = rows.some((r) => allowDelete(user, r))
  return <Table compact className="report-table">
    <TableColumns allowDelete={includeDelete} />
    <TableBody
      key={rows[0].batchId}
      user={user}
      rawEntries={rows}
    />
  </Table>
}

const TableColumns = ({ allowDelete }) => (
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Student number</Table.HeaderCell>
      <Table.HeaderCell>Credits</Table.HeaderCell>
      <Table.HeaderCell>Grade</Table.HeaderCell>
      <Table.HeaderCell>Completion date</Table.HeaderCell>
      <Table.HeaderCell>Language</Table.HeaderCell>
      <Table.HeaderCell>Date sent</Table.HeaderCell>
      <Table.HeaderCell>Grader</Table.HeaderCell>
      <Table.HeaderCell >Sisu details</Table.HeaderCell>
      <Popup
        content={
          <div>
            Is the sent attainment successfully registered in Sisu.
            <strong> One checkmark</strong> means that the attainment
            is successfully registered as a partial attainment (osasuoritus).
            <strong> Two checkmarks</strong> means attainment can be found as an actual
            course completion in Sisu.
          </div>
        }
        trigger={
          <Table.HeaderCell>In Sisu</Table.HeaderCell>
        }
      />
      {allowDelete
        ? <Table.HeaderCell>Delete</Table.HeaderCell>
        : null}
    </Table.Row>
  </Table.Header>
)

const TableBody = ({ user, rawEntries }) => {
  return <Table.Body data-cy="report-table">
    {rawEntries.map((rawEntry) => {
      const course = rawEntry.course || PLACEHOLDER_COURSE
      return <React.Fragment key={`row-${rawEntry.id}`}>
        <Table.Row warning={rawEntry.entry.missingEnrolment} style={rawEntry.entry.type === 'EXTRA_ENTRY' ? styles.extraEntry : null}>
          <Table.Cell data-cy="report-student-number">{rawEntry.studentNumber}</Table.Cell>
          <Table.Cell data-cy="report-credits">{rawEntry.credits}</Table.Cell>
          <EntryCells
            entry={{ ...rawEntry.entry, gradeId: rawEntry.entry.gradeId || rawEntry.grade }}
            course={getCourseName(rawEntry, course)}
            grader={rawEntry.grader}
          />
          {allowDelete(user, rawEntry)
            ? <Table.Cell>
              <DeleteEntryButton rawEntryId={rawEntry.id} batchId={rawEntry.batchId} />
            </Table.Cell>
            : null}
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
    })}
  </Table.Body>
}

const getSisuStatusCell = (sent, registered) => (
  <>
    {sent && registered === 'NOT_REGISTERED'
      && (
        <Popup
          content="Attainment has been sent to Sisu, but is not (yet) visible there"
          trigger={
            <Icon className="hoverable-item" name="close" color="red" />
          }
        />
      )
    }
    {registered === 'PARTLY_REGISTERED'
      && (
        <Popup
          content="Attainment has been registered to Sisu as an partial attainment (osasuoritus)"
          trigger={<Icon className="hoverable-item" name="checkmark" color="green" />}
        />
      )
    }
    {registered === 'REGISTERED'
      && (
        <Popup
          content="Attainment has been registered as a proper course completion"
          trigger={
            <div>
              <Icon className="hoverable-item" name="checkmark" color="green" />
              <Icon className="hoverable-item" name="checkmark" color="green" />
            </div>
          }
        />
      )
    }
  </>
)

const EntryCells = ({ entry, course, grader }) => {
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
    gradeScaleId,
    gradeId,
    registered,
    studyRightId,
    type,
    missingEnrolment
  } = entry

  const entryAccordionContent = () => <Accordion.Content
    data-cy="report-course-content"
    active={open}
    style={{ padding: "0.75em 1em" }}
  >
    <strong>Realisation name</strong>
    <p>{getSisUnitName(courseUnitRealisationName, completionLanguage) || null}</p>
    <strong>Course unit ID</strong>
    <p>{courseUnitId || null}</p>
    <strong>Course unit realisation ID</strong>
    <p>{courseUnitRealisationId || null}</p>
    <strong>Assessment item ID</strong>
    <p>{assessmentItemId || null}</p>
    <strong>Student id</strong>
    <p>{personId || null}</p>
    <strong>Grader ID</strong>
    <p>{verifierPersonId || null}</p>
    <strong>Grade scale of the course</strong>
    <p>{gradeScaleId || null}</p>
  </Accordion.Content>

  const extraEntryAccordionContent = () => <Accordion.Content
    data-cy="report-course-content"
    active={open}
    style={{ padding: "0.75em 1em" }}
  >
    <strong>Course unit ID</strong>
    <p>{courseUnitId || null}</p>
    <strong>Study right id</strong>
    <p>{studyRightId || null}</p>
    <strong>Grader ID</strong>
    <p>{verifierPersonId || null}</p>
    <strong>Grade scale of the course</strong>
    <p>{gradeScaleId || null}</p>
  </Accordion.Content>

  return (
    <>
      <Table.Cell data-cy="report-entry-grade">
        {!missingEnrolment || type === 'EXTRA_ENTRY' ? getGrade(gradeScaleId, gradeId, completionLanguage) : gradeId}
      </Table.Cell>
      <Table.Cell data-cy="report-completionDate">
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell data-cy="report-completionLanguage">
        {completionLanguage ? completionLanguage : null}
      </Table.Cell>
      <Table.Cell data-cy="report-sent">
        {sent ? moment(sent).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell>{grader ? grader.name : 'Grader not found'}</Table.Cell>
      <Table.Cell
        data-cy={`report-courseUnitRealisationName-${gradeId}`}
      >
        <Accordion className="report-table-accordion" style={entry.type === 'EXTRA_ENTRY' ? styles.extraEntry : null}>
          <Accordion.Title
            active
            data-cy="entry-accordion"
            onClick={() => setOpen(!open)}
          >
            <Icon name={`caret ${open ? 'down' : 'right'}`} />
            {course}
          </Accordion.Title>
          {type === 'ENTRY' ? entryAccordionContent() : extraEntryAccordionContent()}
        </Accordion>
      </Table.Cell>
      <Table.Cell data-cy="report-registered">
        {getSisuStatusCell(sent, registered)}
      </Table.Cell>
    </>
  )
}


const parseEntryError = (error) => {
  const errors = []
  try {
    Object.keys(error).forEach((key) => {
      const { messageTemplate, message } = error[key]
      if (!sisuErrorMessages[messageTemplate]) {
        errors.push(message)
      } else
        errors.push(sisuErrorMessages[messageTemplate])
    })
  } catch (e) {
    return 'Click to view full error'
  }
  return errors.join(", ")
}

const MinimalExpand = ({ title, content }) => {
  const [open, setOpen] = useState(false)
  return <>
    <span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>{title} <Icon name={`triangle ${open ? 'down' : 'right'}`} /></span>
    {open ? <p>{content}</p> : null}
  </>
}

const getSisUnitName = (name, language) => {
  try {
    const parsed = typeof name === 'string' ? JSON.parse(name) : name
    if (!parsed) return <span style={{ color: '#573a08' }}>Enrolment missing</span>
    if (!parsed[language]) return parsed['fi']
    return parsed[language]
  } catch {
    return `${name}`
  }
}

const getCourseName = (rawEntry, course) => {
  if (rawEntry.entry.type === 'EXTRA_ENTRY')
    return `Erilliskirjaus (${course.courseCode})`
  if (EOAI_CODES.includes(course.courseCode))
    return `${EOAI_NAMEMAP[rawEntry.entry.completionLanguage].name} (${course.courseCode})`
  return `${course.name} (${course.courseCode})`
}

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