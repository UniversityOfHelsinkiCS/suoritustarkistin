import FormDialog from '@client/components/FormDialog'
import Message from '@client/components/Message'
import UserForm from '@client/components/UsersPage/UserForm'
import UserTable from '@client/components/UsersPage/UserTable'
import { getAllUsersAction } from '@client/utils/redux/usersReducer'
import { Button } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllUsersAction())
  }, [dispatch])

  return (
    <>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" color="success" data-cy="add-user-button" onClick={open}>
            Add new user
          </Button>
        )}
      >
        {(close) => <UserForm close={close} />}
      </FormDialog>
      <Message />
      <UserTable />
    </>
  )
}
