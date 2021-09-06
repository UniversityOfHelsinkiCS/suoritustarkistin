import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Icon, Message, Segment, Table } from 'semantic-ui-react'
import moment from 'moment'

import Notification from 'Components/Message'
import { EOAI_CODES, EOAI_NAMEMAP } from 'Root/utils/validators'
import {
  getAllEnrollmentLimboEntriesAction,
  handleEntryDeletionAction,
  refreshEnrollmentsAction
} from 'Utilities/redux/sisReportsReducer'
import Pagination from './Pagination'


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
      data-cy={`report-entry-delete-button-${id}`}
      color="red"
      onClick={() => dispatch(handleEntryDeletionAction(id))}
    >
      Delete
    </Button>
  )
}

const RefreshEnrollmentsButton = () => {
  const dispatch = useDispatch()
  return <Button
    onClick={() => dispatch(refreshEnrollmentsAction())}
    icon
  >
    <Icon name="refresh" /> Refresh enrollments from Sisu
  </Button>
}

const EnrolmentLimbo = () => {
  const dispatch = useDispatch()

  const { rows, offset, reportsFetched } = useSelector((state) => state.sisReports.enrolmentLimbo)
  const { pending } = useSelector((state) => state.sisReports)

  useEffect(() => {
    if (!reportsFetched && !pending)
      dispatch(getAllEnrollmentLimboEntriesAction(offset))
  })

  return <>
    <Notification />
    {!rows.length && !pending && reportsFetched
      ? <Message success>
        No completions without enrollment info!
      </Message>
      : <>
        <Segment loading={pending}>
          <Message style={{ maxWidth: 800 }} info>
            <Message.Header>What is enrollment limbo?</Message.Header>
            <Message.Content>
              Here is listed all individual completions without an enrollment in Sisu. Refresh enrollments button will check new enrollments from Sisu and create a new batch for entries with found enrollment. Refresh is done automatically once a week.
            </Message.Content>
          </Message>
          <RefreshEnrollmentsButton />
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
              {rows.map((rawEntry) => (
                <Table.Row key={rawEntry.id}>
                  <Table.Cell data-cy={`report-course-code-${rawEntry.id}`}>{getCourseCode(rawEntry, rawEntry.course)}</Table.Cell>
                  <Table.Cell data-cy={`report-course-name-${rawEntry.id}`}>{getCourseName(rawEntry, rawEntry.course)}</Table.Cell>
                  <Table.Cell data-cy={`report-student-number-${rawEntry.id}`}>{rawEntry.studentNumber}</Table.Cell>
                  <Table.Cell data-cy={`report-credits-${rawEntry.id}`}>{rawEntry.credits}</Table.Cell>
                  <Table.Cell data-cy={`report-personId-${rawEntry.id}`}>{rawEntry.entry.personId}</Table.Cell>
                  <Table.Cell data-cy={`report-completionDate-${rawEntry.id}`}>
                    {rawEntry.entry.completionDate ? moment(rawEntry.entry.completionDate).format("DD.MM.YYYY") : null}
                  </Table.Cell>
                  <Table.Cell data-cy={`report-completionLanguage-${rawEntry.id}`}>
                    {rawEntry.entry.completionLanguage ? rawEntry.entry.completionLanguage : null}
                  </Table.Cell>
                  <Table.Cell data-cy={`report-completionDate-${rawEntry.id}`}>
                    {moment(rawEntry.createdAt).format("DD.MM.YYYY")}
                  </Table.Cell>
                  <Table.Cell>
                    <DeleteButton id={rawEntry.id} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Pagination reduxKey="enrolmentLimbo" action={getAllEnrollmentLimboEntriesAction} disableFilters />
        </Segment>
      </>}
  </>
}

export default EnrolmentLimbo
