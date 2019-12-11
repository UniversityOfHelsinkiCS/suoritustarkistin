import React from 'react'
import { Button, Table } from 'semantic-ui-react'

export default ({ course, setEditMode }) => {
  return (
    <Table celled>
      <Table.Body>
        <Table.Row>
          <Table.Cell>{course.name}</Table.Cell>
          <Table.Cell>{course.courseCode}</Table.Cell>
          <Table.Cell>{course.language}</Table.Cell>
          <Table.Cell>{course.credits}</Table.Cell>
          <Table.Cell>
            <Button onClick={() => setEditMode(true)} content="Edit" />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}
