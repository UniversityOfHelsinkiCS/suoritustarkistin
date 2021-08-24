import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Grid, Header, Icon, Segment } from 'semantic-ui-react'

import User from 'Components/UsersPage/User'
import { sortedItems } from 'Utilities/common'


export default () => {
  const [sorter, setSorter] = useState('name')
  const [reverse, setReverse] = useState(false)
  const users = useSelector((state) => state.users.data)

  if (!users) return null

  const getCustomHeader = ({ name, field, sortable = true }) => {
    const sortHandler = sortable
      ? () => {
        if (sorter === field) {
          setReverse(!reverse)
        } else {
          setReverse(false)
          setSorter(field)
        }
      }
      : undefined

    return (
      <Header
        as="h4"
        onClick={sortHandler}
        style={sortable ? { cursor: 'pointer' } : {} }
      >
        {name} {sortable && <Icon style={{ fontSize: "1.2em" }} name="sort" />}
      </Header>
    )
  }

  return (
    <Segment>
      <Grid celled="internally" style={{wordWrap: 'anywhere'}}>
        <Grid.Row>
          <Grid.Column width={8}>
            {getCustomHeader({ name: 'Name (uid)', field: 'name' })}
          </Grid.Column>
          <Grid.Column textAlign="center" width={1}>
            {getCustomHeader({ name: 'Grader', field: 'isGrader' })}
          </Grid.Column>
          <Grid.Column textAlign="center" width={1}>
            {getCustomHeader({ name: 'Admin', field: 'isAdmin' })}
          </Grid.Column>
          <Grid.Column textAlign="center" width={2}>
            {getCustomHeader({ name: 'Last login', field: 'lastLogin', sortable: false })}
          </Grid.Column>
          <Grid.Column textAlign="center" width={3}>
            <Header as="h4">Edit</Header>
          </Grid.Column>
          <Grid.Column width={1} />
        </Grid.Row>
        {sortedItems(users, sorter, reverse).map((u) => (
          <User user={u} key={u.id} />
        ))}
      </Grid>
    </Segment>
  )
}
