import User from '@client/components/UsersPage/User'
import { sortedItems } from '@client/utils/common'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

export const celledBorders = {
  '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
  '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
}

export default () => {
  const [sorter, setSorter] = useState('name')
  const [reverse, setReverse] = useState(false)
  const users = useSelector((state) => state.users.data)

  if (!users) return null

  const getCustomHeader = ({ name, field, sortable = true, width, align }) => {
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
      <TableCell
        align={align}
        onClick={sortHandler}
        sx={{ width, fontWeight: 700, cursor: sortable ? 'pointer' : 'default' }}
      >
        {name} {sortable && <SwapVertIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />}
      </TableCell>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table data-cy="user-grid" size="small" sx={{ wordWrap: 'anywhere', ...celledBorders }}>
        <TableHead>
          <TableRow>
            {getCustomHeader({ name: 'Name (uid)', field: 'name', width: '25%' })}
            {getCustomHeader({ name: 'Grader', field: 'isGrader', align: 'center' })}
            {getCustomHeader({ name: 'Admin', field: 'isAdmin', align: 'center' })}
            {getCustomHeader({
              name: 'Last login',
              field: 'lastLogin',
              sortable: false,
              align: 'center',
              width: '12%'
            })}
            <TableCell align="center" sx={{ width: '37%', fontWeight: 700 }}>
              Edit
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems(users, sorter, reverse).map((u) => (
            <User user={u} key={u.id} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
