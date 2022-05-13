import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Header, Loader, Segment, Table } from 'semantic-ui-react'
import moment from 'moment'

import { addKurkiRawEntriesAction } from 'Utilities/redux/kurkiReducer'

const CourseTable = () => {
  const dispatch = useDispatch()
  const kurki = useSelector((state) => state.kurki)

  if (!kurki || !kurki.courses) return null

  const createReport = (course) => {
    const newCourse = {
      kurkiId: course.id,
      name: course.name,
      credits: course.credits,
      language: course.language,
      graderUid: course.ownerId
    }
    dispatch(addKurkiRawEntriesAction(newCourse))
  }

  return (
    <Segment>
      <Loader size="big" active={kurki.pending} />
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.Cell width={2}>
              <Header as="h4">Course code</Header>
            </Table.Cell>
            <Table.Cell width={5}>
              <Header as="h4">Course name</Header>
            </Table.Cell>
            <Table.Cell width={2}>
              <Header as="h4">Grader</Header>
            </Table.Cell>
            <Table.Cell width={2}>
              <Header as="h4">Start date</Header>
            </Table.Cell>
            <Table.Cell width={2}>
              <Header as="h4">End date</Header>
            </Table.Cell>
            <Table.Cell width={3} />
          </Table.Row>
        </Table.Header>
        {kurki.courses.map((course) => (
          <Table.Row key={course.id}>
            <Table.Cell width={2}>{course.id.split('.')[0]}</Table.Cell>
            <Table.Cell width={5}>{course.name}</Table.Cell>
            <Table.Cell width={2}>{course.ownerId}</Table.Cell>
            <Table.Cell width={2}>{moment(course.startDate).format('DD.MM.YYYY')}</Table.Cell>
            <Table.Cell width={2}>{moment(course.finishDate).format('DD.MM.YYYY')}</Table.Cell>
            <Table.Cell width={3}>
              <Button color="blue" disabled={course.disabled} onClick={() => createReport(course)}>
                Create a report
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
        <Table.Row />
      </Table>
    </Segment>
  )
}

export default CourseTable
