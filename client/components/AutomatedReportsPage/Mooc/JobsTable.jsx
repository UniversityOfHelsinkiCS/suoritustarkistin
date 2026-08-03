import React from 'react'
import { useSelector } from 'react-redux'
import { Header, Loader, Segment, Table } from 'semantic-ui-react'
import * as _ from 'lodash'

import JobRow from 'Components/AutomatedReportsPage/Mooc/JobRow'

export default () => {
  const jobs = useSelector((state) => state.moocJobs)
  const courses = useSelector((state) => state.courses.data)

  if (!jobs || !jobs.data) return null

  const sortedJobs = _.orderBy(
    jobs.data,
    [
      'active',
      (job) => {
        const course = courses?.find((c) => c.id === job.courseId)
        return course?.name?.toLowerCase() || ''
      }
    ],
    ['desc', 'asc']
  )

  return (
    <Segment>
      <Loader size="big" active={jobs.pending} />
      <Table celled data-cy="mooc-job-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1}>
              <Header as="h4">Schedule</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={2}>
              <Header as="h4">Course code</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={3}>
              <Header as="h4">Course name</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={2}>
              <Header as="h4">Grader</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={2}>
              <Header as="h4">Slug</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={1}>
              <Header as="h4">Active</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={1}>
              <Header as="h4">Use manual completion date</Header>
            </Table.HeaderCell>
            <Table.HeaderCell width={4}>
              <Header as="h4">Actions</Header>
            </Table.HeaderCell>
          </Table.Row>
          {sortedJobs.map((j) => (
            <JobRow job={j} jobs={jobs} key={j.id} />
          ))}
        </Table.Header>
      </Table>
    </Segment>
  )
}
