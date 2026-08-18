import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Dialog, DialogContent } from '@mui/material'

import Message from '@client/components/Message'
import UserTable from '@client/components/UsersPage/UserTable'
import UserForm from '@client/components/UsersPage/UserForm'
import { getAllUsersAction } from '@client/utils/redux/usersReducer'

export default () => {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    dispatch(getAllUsersAction())
  }, [dispatch])

  return (
    <>
      <Button variant="contained" color="success" data-cy="add-user-button" onClick={() => setShowForm(true)}>
        Add new user
      </Button>
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogContent>
          <UserForm close={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Message />
      <UserTable />
    </>
  )
}
