import moment from 'moment'
import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Table, Button, Popup, Segment, Header, Divider, Message, Icon } from 'semantic-ui-react'
import NotificationMessage from 'Components/Message'

import { resetNewRawEntriesConfirmAction, resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import {
  handleBatchDeletionAction,
  sendEntriesToSisAction,
  openReport,
  sendMissingEnrollmentEmail
} from 'Utilities/redux/sisReportsReducer'

const styles = {
  extraEntry: {
    backgroundColor: '#F8FCFF'
  },
  missingEnrolment: {
    backgroundColor: '#F8FCFF'
  },
  missingEnrolmentInfo: {
    maxWidth: '620px'
  },
  completionDate: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}

export default withRouter(({ rows, batchId, history }) => {
  const dispatch = useDispatch()
  const { pending, error } = useSelector((state) => state.sisReports)
  const graderId = useSelector((state) => state.newRawEntries.graderId)
  const [sent, setSent] = useState(false)
  const onlyMissingEnrollments = rows.every(({ entry }) => entry.type === 'ENTRY' && entry.missingEnrolment)

  useEffect(() => {
    if (sent && !pending && !(error || {}).genericError) {
      dispatch(openReport(batchId))
      dispatch(resetNewRawEntriesAction(graderId))
      history.push('/reports')
    }
  }, [pending, error, sent])

  useEffect(() => {
    window.onbeforeunload = () => '' // Display confirmation alert when tab is closed
    return () => (window.onbeforeunload = null)
  })

  const entriesToSisu = rows
    .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
    .reduce(
      (acc, { entry }) => {
        if (entry.type === 'ENTRY') acc.entries.push(entry.id)
        else acc.extraEntries.push(entry.id)
        return acc
      },
      { entries: [], extraEntries: [] }
    )

  const getCourseUnitRealisationName = (entry) => {
    if (entry.missingEnrolment) return 'Missing enrollment'
    if (entry.type === 'EXTRA_ENTRY') return 'Erilliskirjaus'
    return entry.courseUnitRealisationName
      ? JSON.parse(entry.courseUnitRealisationName).fi || JSON.parse(entry.courseUnitRealisationName).en
      : null
  }

  const SendButton = () => {
    if (onlyMissingEnrollments)
      return (
        <Button
          icon="save"
          content="Approve"
          onClick={send}
          disabled={pending}
          data-cy="confirm-entries-send-missing-enrolment"
          positive
        />
      )

    return (
      <Popup
        trigger={<Button icon="send" content="Approve" disabled={pending} data-cy="confirm-entries-send" positive />}
        content={
          <Button
            positive
            data-cy="confirm-entries-send-confirm"
            onClick={send}
            content={`Are you sure? Sending ${
              entriesToSisu.entries.length + entriesToSisu.extraEntries.length
            } completion(s) to Sisu`}
          />
        }
        on="click"
        position="top center"
      />
    )
  }

  const MissingEnrollmentsInfo = () =>
    onlyMissingEnrollments ? (
      <Message style={styles.missingEnrolmentInfo} warning>
        The report contains only completions with missing enrollments and nothing will be sent to Sisu.
        <br />
        When a student enrolls to the course the completion will be sent automatically to Sisu.
      </Message>
    ) : null

  const CompletionDate = ({ attainmentDate, completionDate }) =>
    completionDate ? (
      <div style={styles.completionDate}>
        <span>{moment(completionDate).format('DD.MM.YYYY')}</span>
        {!moment(attainmentDate).isSame(moment(completionDate), 'day') ? (
          <Popup
            content={`Completion date is adjusted automatically to match the study right in the enrollment. Original completion date was ${moment(
              attainmentDate
            ).format('DD.MM.YYYY')}`}
            trigger={<Icon name="pencil alternate" circular />}
          />
        ) : null}
      </div>
    ) : null

  const revert = () => {
    dispatch(resetNewRawEntriesConfirmAction())
    dispatch(handleBatchDeletionAction(batchId))
  }

  const send = async () => {
    const { entries, extraEntries } = rows
      .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
      .reduce(
        (acc, { entry }) => {
          if (entry.type === 'ENTRY') acc.entries.push(entry.id)
          else acc.extraEntries.push(entry.id)
          return acc
        },
        { entries: [], extraEntries: [] }
      )
    if (entries.length || extraEntries.length) await dispatch(sendEntriesToSisAction(entries, extraEntries))
    else dispatch(sendMissingEnrollmentEmail(batchId))
    setSent(true)
  }

  return (
    <Segment>
      <Segment basic>
        <Header as="h3">Check and approve the entries</Header>
        <p>After approving, the completions will be sent to Sisu.</p>
        <Divider />
        <p>
          Entries with missing enrollments are saved to Suotar and the completions will be sent to Sisu automatically
          after student enrolls to the course.{' '}
        </p>
        <MissingEnrollmentsInfo />
      </Segment>
      {sent && error ? (
        <Segment basic>
          <NotificationMessage />
        </Segment>
      ) : null}
      <Segment loading={pending} basic>
        <Table compact celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Student number</Table.HeaderCell>
              <Table.HeaderCell>Student name</Table.HeaderCell>
              <Table.HeaderCell>Grade</Table.HeaderCell>
              <Table.HeaderCell>Completion date</Table.HeaderCell>
              <Table.HeaderCell>Language</Table.HeaderCell>
              <Table.HeaderCell>Credits</Table.HeaderCell>
              <Table.HeaderCell>Course realisation name</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-cy="confirm-entries-table">
            {rows.map(({ entry, ...rawEntry }) => {
              return (
                <Table.Row
                  key={entry.id}
                  warning={entry.missingEnrolment}
                  style={entry.type === 'EXTRA_ENTRY' ? styles.extraEntry : null}
                >
                  <Table.Cell>{rawEntry.studentNumber}</Table.Cell>
                  <Table.Cell>{rawEntry.studentName}</Table.Cell>
                  <Table.Cell>
                    {!entry.missingEnrolment || entry.type === 'EXTRA_ENTRY'
                      ? getGrade(entry.gradeScaleId, entry.gradeId, entry.completionLanguage)
                      : rawEntry.grade}
                  </Table.Cell>
                  <Table.Cell>
                    <CompletionDate attainmentDate={rawEntry.attainmentDate} completionDate={entry.completionDate} />
                  </Table.Cell>
                  <Table.Cell>{rawEntry.language}</Table.Cell>
                  <Table.Cell>{rawEntry.credits}</Table.Cell>
                  <Table.Cell>{getCourseUnitRealisationName(entry)}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </Segment>
      <Segment basic>
        <SendButton />
        <Button
          icon="trash"
          content="Cancel"
          disabled={pending}
          onClick={revert}
          data-cy="confirm-entries-cancel"
          negative
        />
      </Segment>
    </Segment>
  )
})

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
