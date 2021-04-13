import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getAllUsersAction } from 'Utilities/redux/usersReducer'
import Message from 'Components/Message'
import UserTable from 'Components/UsersPage/UserTable'
import UserForm from 'Components/UsersPage/UserForm'
import { Modal, Button } from 'semantic-ui-react'

export default () => {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState()

  useEffect(() => {
    dispatch(getAllUsersAction())
  }, [])

  return (
    <>
      <Modal
        trigger={
          <Button
            data-cy="add-user-button"
            positive
            onClick={() => setShowForm(true)}
          >
            Add new user
          </Button>
        }
        basic
        open={showForm}
        onClose={() => setShowForm(false)}
        size="small"
      >
        <Modal.Content>
          <UserForm close={() => setShowForm(false)} />
        </Modal.Content>
      </Modal>
      <Message />
      <UserTable />
    </>
  )
}
