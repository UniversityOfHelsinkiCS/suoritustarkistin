import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Accordion, Button, Icon, Table } from 'semantic-ui-react'

import { EOAI_CODES, EOAI_NAMEMAP } from '../../../../utils/validators'
import moment from 'moment'
import sisuErrorMessages from 'Utilities/sisuErrorMessages.json'
import { sisHandleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'


export default ({ rows, course, allowDelete }) => (
  rows.length && (
    <Table className="sis-report-table">
      <TableColumns allowDelete={allowDelete} />
      <TableBody key={rows[0].batchId} rawEntries={rows} course={course} allowDelete={allowDelete} />
    </Table>
  )
)

const TableColumns = ({ allowDelete }) => (
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
      {allowDelete
        ? <Table.HeaderCell>Delete</Table.HeaderCell>
        : null}
    </Table.Row>
  </Table.Header>
)

const TableBody = ({ rawEntries, course, allowDelete }) => (
  <Table.Body data-cy="sis-report-table">
    {rawEntries.map((rawEntry) => (
      <React.Fragment key={`row-${rawEntry.id}`}>
        <Table.Row warning={rawEntry.entry.missingEnrolment}>
          <Table.Cell data-cy={`sis-report-course-code-${rawEntry.id}`}>{getCourseCode(rawEntry, course)}</Table.Cell>
          <Table.Cell data-cy={`sis-report-course-name-${rawEntry.id}`}>{getCourseName(rawEntry, course)}</Table.Cell>
          <Table.Cell data-cy={`sis-report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
          <Table.Cell data-cy={`sis-report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
          <EntryCells entry={rawEntry.entry} />
          {allowDelete
            ? <Table.Cell>
              <DeleteButton id={rawEntry.id} />
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
    ))}
  </Table.Body>
)

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
    const parsed = typeof name === 'string' ? JSON.parse(name) : name
    if (!parsed) return <span style={{ color: '#573a08' }}>Enrolment missing</span>
    if (!parsed[language]) return parsed['fi']
    return parsed[language]
  } catch {
    return `${name}`
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
