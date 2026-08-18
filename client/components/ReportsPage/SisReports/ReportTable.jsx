import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import moment from 'moment'

import { EOAI_CODES, EOAI_NAMEMAP } from '@shared/common'
import sisuErrorMessages from '@client/utils/sisuErrorMessages.json'
import DeleteEntryButton from './DeleteEntryButton'

const PLACEHOLDER_COURSE = {
  id: 'COURSE DELETED',
  name: 'COURSE DELETED',
  courseCode: 'COURSE DELETED',
  language: 'COURSE DELETED',
  credits: 'COURSE DELETED'
}

const detailsStyle = (open) => ({
  padding: '0.75em 1em',
  display: open ? 'block' : 'none',
  overflowWrap: 'anywhere',
  '& strong': { display: 'block', mt: '0.75em' },
  '& strong:first-of-type': { mt: 0 },
  '& p': { m: '0.15em 0 0 0' }
})

// Semantic's tables drew column separators; MUI cells only draw a bottom border.
const celledBorders = {
  '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
  '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
}

const styles = {
  extraEntry: { backgroundColor: '#F8FCFF' },
  missingEnrolment: { backgroundColor: '#fcf6d9' },
  basic: {}
}

const getTableRowStyle = (entry) => {
  if (!entry) return styles.basic
  if (entry.missingEnrolment) return styles.missingEnrolment
  if (entry.type === 'EXTRA_ENTRY') return styles.extraEntry
  return styles.basic
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

  if (!rows.length) return null

  const includeDelete = rows.some((r) => allowDelete(user, r))
  return (
    <Table size="small" className="report-table" sx={celledBorders}>
      <TableColumns allowDelete={includeDelete} />
      <EntryRows key={rows[0].batchId} user={user} rawEntries={rows} />
    </Table>
  )
}

const TableColumns = ({ allowDelete }) => (
  <TableHead>
    <TableRow>
      <TableCell>Student number</TableCell>
      <TableCell>Student name</TableCell>
      <TableCell>Credits</TableCell>
      <TableCell>Grade</TableCell>
      <TableCell>Completion date</TableCell>
      <TableCell>Language</TableCell>
      <TableCell>Date sent</TableCell>
      <TableCell>Grader</TableCell>
      <TableCell>Sisu details</TableCell>
      <Tooltip
        title={
          <div>
            <p>
              <strong>Suotar checks this status from Sisu once per day</strong>
            </p>
            <p>
              <strong> One checkmark</strong> means that the attainment is successfully registered in Sisu as a partial
              attainment (osasuoritus).
            </p>
            <p>
              <strong> Two checkmarks</strong> means attainment can be found as an actual course completion in Sisu
              (kurssisuoritus). Updating from a partial attainment to a completion happens in Sisu during the night
            </p>
          </div>
        }
      >
        <TableCell>
          In Sisu <HelpOutlineIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
        </TableCell>
      </Tooltip>
      {allowDelete ? <TableCell>Delete</TableCell> : null}
    </TableRow>
  </TableHead>
)

const parseEntryError = (error) => {
  const errors = []
  try {
    Object.keys(error).forEach((key) => {
      const { messageTemplate, message } = error[key]
      if (!sisuErrorMessages[messageTemplate]) {
        errors.push(message)
      } else errors.push(sisuErrorMessages[messageTemplate])
    })
  } catch {
    return 'Click to view full error'
  }
  return errors.join(', ')
}

const MinimalExpand = ({ title, content }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Box component="span" onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
        {title} {open ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
      </Box>
      {open ? <p>{content}</p> : null}
    </>
  )
}

const getSisUnitName = (name, language) => {
  try {
    const parsed = typeof name === 'string' ? JSON.parse(name) : name
    if (!parsed) return <span style={{ color: '#573a08' }}>Enrolment missing</span>
    if (!parsed[language]) return parsed.fi
    return parsed[language]
  } catch {
    return `${name}`
  }
}

const getCourseName = (rawEntry, course) => {
  if (rawEntry.entry.type === 'EXTRA_ENTRY') return `Erilliskirjaus (${course.courseCode})`
  if (EOAI_CODES.includes(course.courseCode))
    return `${EOAI_NAMEMAP[rawEntry.entry.completionLanguage].name} (${course.courseCode})`
  return `${course.name} (${course.courseCode})`
}

const getGrade = (gradeScaleId, gradeId, language) => {
  if (!gradeId || !gradeScaleId || !language) return null
  if (gradeScaleId === 'sis-0-5') return gradeId
  if (gradeScaleId === 'sis-hyl-hyv') {
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

const EntryRows = ({ user, rawEntries }) => {
  const student = useSelector((state) => state.sisReports.filters.student)

  return (
    <TableBody data-cy="report-table">
      {rawEntries.map((rawEntry) => {
        const course = rawEntry.course || PLACEHOLDER_COURSE
        return (
          <React.Fragment key={`row-${rawEntry.id}`}>
            <TableRow
              data-cy={`report-table-row-${rawEntry.studentNumber}`}
              // Semantic marked filter matches with its own 'active' class; an explicit
              // attribute keeps the highlight assertable without depending on styling.
              data-highlighted={Boolean(student && rawEntry.studentNumber.startsWith(student))}
              sx={student && rawEntry.studentNumber.startsWith(student) ? { outline: '2px solid #2185d0' } : null}
              style={getTableRowStyle(rawEntry.entry)}
            >
              <TableCell data-cy="report-student-number">{rawEntry.studentNumber}</TableCell>
              <TableCell data-cy="report-student-name">{rawEntry.entry.studentName}</TableCell>
              <TableCell data-cy="report-credits">{rawEntry.credits}</TableCell>
              <EntryCells
                entry={{ ...rawEntry.entry, gradeId: rawEntry.entry.gradeId || rawEntry.grade }}
                course={getCourseName(rawEntry, course)}
                grader={rawEntry.grader}
              />
              {allowDelete(user, rawEntry) ? (
                <TableCell>
                  <DeleteEntryButton rawEntryId={rawEntry.id} batchId={rawEntry.batchId} />
                </TableCell>
              ) : null}
            </TableRow>
            {rawEntry.entry.errors && (
              <TableRow>
                <TableCell colSpan={15} sx={{ backgroundColor: '#fff6f6', color: '#9f3a38' }}>
                  <MinimalExpand
                    title={parseEntryError(rawEntry.entry.errors)}
                    content={`Full error: ${JSON.stringify(rawEntry.entry.errors)}`}
                  />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )
      })}
    </TableBody>
  )
}

const getSisuStatusCell = (sent, errors, registered) => (
  <>
    {sent && errors && (
      <Tooltip title="Sending attainment to Sisu failed">
        <CloseIcon className="hoverable-item" color="error" fontSize="small" />
      </Tooltip>
    )}
    {registered === 'PARTLY_REGISTERED' && (
      <Tooltip title="Attainment has been registered to Sisu as an partial attainment (osasuoritus)">
        <CheckIcon className="hoverable-item" color="success" fontSize="small" />
      </Tooltip>
    )}
    {registered === 'REGISTERED' && (
      <Tooltip title="Attainment has been registered as a proper course completion">
        <Box sx={{ display: 'inline-flex', flexWrap: 'nowrap' }}>
          <CheckIcon className="hoverable-item" color="success" fontSize="small" />
          <CheckIcon className="hoverable-item" color="success" fontSize="small" />
        </Box>
      </Tooltip>
    )}
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
    missingEnrolment,
    errors
  } = entry

  const entryAccordionContent = () => (
    <Box data-cy="report-course-content" sx={detailsStyle(open)}>
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
    </Box>
  )

  const extraEntryAccordionContent = () => (
    <Box data-cy="report-course-content" sx={detailsStyle(open)}>
      <strong>Course unit ID</strong>
      <p>{courseUnitId || null}</p>
      <strong>Study right id</strong>
      <p>{studyRightId || null}</p>
      <strong>Grader ID</strong>
      <p>{verifierPersonId || null}</p>
      <strong>Grade scale of the course</strong>
      <p>{gradeScaleId || null}</p>
    </Box>
  )

  return (
    <>
      <TableCell data-cy="report-entry-grade">
        {!missingEnrolment || type === 'EXTRA_ENTRY' ? getGrade(gradeScaleId, gradeId, completionLanguage) : gradeId}
      </TableCell>
      <TableCell data-cy="report-completionDate">
        {completionDate ? moment(completionDate).format('DD.MM.YYYY') : null}
      </TableCell>
      <TableCell data-cy="report-completionLanguage">{completionLanguage || null}</TableCell>
      <TableCell data-cy="report-sent">{sent ? moment(sent).format('DD.MM.YYYY') : null}</TableCell>
      <TableCell>{grader ? grader.name : 'Grader not found'}</TableCell>
      <TableCell data-cy={`report-courseUnitRealisationName-${gradeId}`} sx={{ width: '25%' }}>
        <Box style={entry.type === 'EXTRA_ENTRY' ? styles.extraEntry : null}>
          <Box
            data-cy="entry-accordion"
            onClick={() => setOpen(!open)}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {open ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
            {course}
          </Box>
          {type === 'ENTRY' ? entryAccordionContent() : extraEntryAccordionContent()}
        </Box>
      </TableCell>
      <TableCell data-cy="report-registered">{getSisuStatusCell(sent, errors, registered)}</TableCell>
    </>
  )
}
