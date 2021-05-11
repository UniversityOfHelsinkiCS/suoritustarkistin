import React, { useEffect } from 'react'
import { EOAI_CODES, EOAI_NAMEMAP } from '../../../utils/validators'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { sisHandleEntryDeletionAction, refreshEnrollmentsAction, sisGetAllReportsAction, sisGetUsersReportsAction } from 'Utilities/redux/sisReportsReducer'
import { Button, Icon, Table, Segment, Message } from 'semantic-ui-react'
import Notification from 'Components/Message'


const getCourseCode = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].code
  }
  return course.courseCode
}

const getCourseName = (rawEntry, course) => {
  if (EOAI_CODES.includes(course.courseCode)) {
    return EOAI_NAMEMAP[rawEntry.entry.completionLanguage].name
  }
  return course.name
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

const RefreshEnrollmentsButton = ({ rawEntryIds }) => {
  const dispatch = useDispatch()
  return <Button
    onClick={() => dispatch(refreshEnrollmentsAction(rawEntryIds))}
    icon
  >
    <Icon name="refresh" /> Refresh enrollments from Sisu
  </Button>
}

const EnrolmentLimbo = ({ rawEntries }) => {
  const reports = useSelector((state) => state.sisReports)
  const user = useSelector((state) => state.user.data)
  const dispatch = useDispatch()

  useEffect(() => {
    if (reports.refreshSuccess) {
      if (user.adminMode)
        dispatch(sisGetAllReportsAction())
      else
        dispatch(sisGetUsersReportsAction(user.id))
    }
  }, [reports.refreshSuccess])

  return <>
    <Notification />
    {!rawEntries.length
      ? <Message success>
        No completions without enrollment info!
      </Message>
      : <>
        <Segment loading={reports.pending}>
          <Message style={{ maxWidth: 800 }} info>
            <Message.Header>What is enrollment limbo?</Message.Header>
            <Message.Content>
              Here is listed all individual completions without an enrollment in Sisu. Refresh enrollments button will check new enrollments from Sisu and create a new batch for entries with found enrollment. Refresh is done automatically once a week.
            </Message.Content>
          </Message>
          <RefreshEnrollmentsButton rawEntryIds={rawEntries.map(({ id }) => id)} />
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Course code</Table.HeaderCell>
                <Table.HeaderCell>Course name</Table.HeaderCell>
                <Table.HeaderCell>Student number</Table.HeaderCell>
                <Table.HeaderCell>Credits</Table.HeaderCell>
                <Table.HeaderCell>Student ID</Table.HeaderCell>
                <Table.HeaderCell>Completion date</Table.HeaderCell>
                <Table.HeaderCell>Language</Table.HeaderCell>
                <Table.HeaderCell>Date reported</Table.HeaderCell>
                <Table.HeaderCell>Delete</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rawEntries.map((rawEntry) => (
                <Table.Row key={rawEntry.id}>
                  <Table.Cell data-cy={`sis-report-course-code-${rawEntry.id}`}>{getCourseCode(rawEntry, rawEntry.course)}</Table.Cell>
                  <Table.Cell data-cy={`sis-report-course-name-${rawEntry.id}`}>{getCourseName(rawEntry, rawEntry.course)}</Table.Cell>
                  <Table.Cell data-cy={`sis-report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
                  <Table.Cell data-cy={`sis-report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
                  <Table.Cell data-cy={`sis-report-personId-${rawEntry.id}`}>{rawEntry.entry.personId}</Table.Cell>
                  <Table.Cell data-cy={`sis-report-completionDate-${rawEntry.id}`}>
                    {rawEntry.entry.completionDate ? moment(rawEntry.entry.completionDate).format("DD.MM.YYYY") : null}
                  </Table.Cell>
                  <Table.Cell data-cy={`sis-report-completionLanguage-${rawEntry.id}`}>
                    {rawEntry.entry.completionLanguage ? rawEntry.entry.completionLanguage : null}
                  </Table.Cell>
                  <Table.Cell data-cy={`sis-report-completionDate-${rawEntry.id}`}>
                    {moment(rawEntry.createdAt).format("DD.MM.YYYY")}
                  </Table.Cell>
                  <Table.Cell>
                    <DeleteButton id={rawEntry.id} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      </>}
  </>
}

export default EnrolmentLimbo
