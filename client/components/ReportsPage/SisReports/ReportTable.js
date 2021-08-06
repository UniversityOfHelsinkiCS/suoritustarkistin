import React, { useState } from 'react'
import { Accordion, Icon, Table, Popup } from 'semantic-ui-react'
import { useSelector } from 'react-redux'

import { EOAI_CODES, EOAI_NAMEMAP } from '../../../../utils/validators'
import moment from 'moment'
import sisuErrorMessages from 'Utilities/sisuErrorMessages.json'
import DeleteEntryButton from './DeleteEntryButton'

const PLACEHOLDER_COURSE = {
  id: 'COURSE DELETED',
  name: 'COURSE DELETED',
  courseCode: 'COURSE DELETED',
  language: 'COURSE DELETED',
  credits: 'COURSE DELETED'
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
  return <Table className="report-table">
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
      <Table.HeaderCell>Course code</Table.HeaderCell>
      <Table.HeaderCell>Course name</Table.HeaderCell>
      <Table.HeaderCell>Student number</Table.HeaderCell>
      <Table.HeaderCell>Credits</Table.HeaderCell>
      <Table.HeaderCell>Grader</Table.HeaderCell>
      <Table.HeaderCell colSpan='2'>Course Unit</Table.HeaderCell>
      <Table.HeaderCell>Student ID</Table.HeaderCell>
      <Table.HeaderCell>Completion date</Table.HeaderCell>
      <Table.HeaderCell>Language</Table.HeaderCell>
      <Table.HeaderCell>Grade</Table.HeaderCell>
      <Table.HeaderCell>Date sent</Table.HeaderCell>
      <Table.HeaderCell>Sender name</Table.HeaderCell>
      <Popup content='Is the attainment successfully registered in Sisu' trigger={<Table.HeaderCell>In Sisu</Table.HeaderCell>} />
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
        <Table.Row warning={rawEntry.entry.missingEnrolment}>
          <Table.Cell data-cy={`report-course-code-${rawEntry.id}`}>{getCourseCode(rawEntry, course)}</Table.Cell>
          <Table.Cell data-cy={`report-course-name-${rawEntry.id}`}>{getCourseName(rawEntry, course)}</Table.Cell>
          <Table.Cell data-cy={`report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
          <Table.Cell data-cy={`report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
          <Table.Cell>{rawEntry.grader ? rawEntry.grader.name : 'Grader not found'}</Table.Cell>
          <EntryCells entry={rawEntry.entry} />
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
        data-cy={`report-courseUnitRealisationName-${entry.id}`}
        colSpan='2'
      >
        <Accordion className="report-table-accordion" >
          <Accordion.Title
            active
            onClick={() => setOpen(!open)}
            data-cy={`report-entry-course-${entry.id}`}
          >
            <Icon name={`caret ${open ? 'down' : 'right'}`} />
            {getSisUnitName(courseUnitRealisationName, completionLanguage)}
          </Accordion.Title>
          <Accordion.Content
            data-cy={`report-course-content-${entry.id}`}
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
      <Table.Cell data-cy={`report-personId-${entry.id}`}>
        {personId ? personId : null}
      </Table.Cell>
      <Table.Cell data-cy={`report-completionDate-${entry.id}`}>
        {completionDate ? moment(completionDate).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell data-cy={`report-completionLanguage-${entry.id}`}>
        {completionLanguage ? completionLanguage : null}
      </Table.Cell>
      <Table.Cell data-cy={`report-entry-grade-${entry.id}`}>
        {getGrade(gradeScaleId, gradeId, completionLanguage)}
      </Table.Cell>
      <Table.Cell data-cy={`report-sent-${entry.id}`}>
        {sent ? moment(sent).format("DD.MM.YYYY") : null}
      </Table.Cell>
      <Table.Cell data-cy={`report-senderName-${entry.id}`}>
        {sender ? sender.name : null}
      </Table.Cell>
      <Table.Cell data-cy={`report-registered-${entry.id}`}>
        {registered === 'NOT_REGISTERED' ? <Icon name="close" color="red" /> : null}
        {registered === 'PARTLY_REGISTERED' ? <Icon name="checkmark" color="green" /> : null}
        {registered === 'REGISTERED' ? <><Icon name="checkmark" color="green" /> <Icon name="checkmark" color="green" /></> : null}
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