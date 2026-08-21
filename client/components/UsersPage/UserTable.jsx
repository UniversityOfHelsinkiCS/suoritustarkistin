import DataTable from '@client/components/DataTable'
import RoleToggle from '@client/components/UsersPage/RoleToggle'
import UserActions from '@client/components/UsersPage/UserActions'
import { Box } from '@mui/material'
import moment from 'moment'
import { useSelector } from 'react-redux'

const columns = [
  { key: 'name', header: 'Name (uid)', width: '30%', sortable: true, render: (user) => `${user.name} (${user.uid})` },
  {
    key: 'isGrader',
    header: 'Grader',
    width: '10%',
    align: 'center',
    sortable: true,
    render: (user) => <RoleToggle user={user} roleKey="isGrader" label="grader" />
  },
  {
    key: 'isAdmin',
    header: 'Admin',
    width: '10%',
    align: 'center',
    sortable: true,
    render: (user) => <RoleToggle user={user} roleKey="isAdmin" label="admin" />
  },
  {
    key: 'lastLogin',
    header: 'Last login',
    width: '15%',
    align: 'center',
    sortable: true,
    render: (user) =>
      user.lastLogin ? (
        moment(user.lastLogin).format('DD.MM.YYYY')
      ) : (
        <Box component="span" sx={{ color: 'gray' }}>
          Not saved
        </Box>
      )
  },
  { key: 'actions', header: 'Actions', width: '20%', align: 'center', render: (user) => <UserActions user={user} /> }
]

export default () => {
  const users = useSelector((state) => state.users.data)

  return (
    <DataTable
      data-cy="user-grid"
      columns={columns}
      rows={users}
      rowKey={(user) => user.id}
      defaultSort={[{ key: 'name', direction: 'asc' }]}
    />
  )
}
