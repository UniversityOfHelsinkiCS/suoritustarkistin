import { ConfirmButton } from '@client/components/ConfirmPopover'
import { RowActions } from '@client/components/DataTable'
import FormDialog from '@client/components/FormDialog'
import UserForm from '@client/components/UsersPage/UserForm'
import { deleteUser } from '@client/utils/redux/usersReducer'
import { Button, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'

const logInAs = (user) => () => {
  localStorage.setItem('adminLoggedInAs', user.employeeId)

  if (process.env.NODE_ENV === 'production') window.location.href = '/suoritustarkistin'
  else if (process.env.NODE_ENV === 'staging') window.location.href = '/suotar'
  else window.location.href = '/'
}

export default ({ user }) => {
  const dispatch = useDispatch()

  return (
    <RowActions>
      <FormDialog
        trigger={(open) => (
          <Button data-cy={`${user.name}-edit`} variant="contained" size="small" onClick={open}>
            Edit
          </Button>
        )}
      >
        {(close) => <UserForm user={user} close={close} />}
      </FormDialog>
      <ConfirmButton
        dataCy={`${user.name}-delete`}
        confirmDataCy="delete-user-confirm"
        label="Delete"
        confirmLabel="Yes, delete the user"
        description={
          <Typography sx={{ mb: 1 }}>
            This does not delete the reports by the user. But{' '}
            <strong>the reports will no longer have any mention of the user</strong>
          </Typography>
        }
        onConfirm={() => dispatch(deleteUser(user.id))}
      />
      <Button variant="contained" size="small" color="secondary" onClick={logInAs(user)}>
        Log in as
      </Button>
    </RowActions>
  )
}
