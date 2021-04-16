import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Grid, Icon, Popup, Modal } from 'semantic-ui-react'

import { editUserAction, deleteUser } from 'Utilities/redux/usersReducer'
import UserForm from 'Components/UsersPage/UserForm'

export default ({ user }) => {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)

  const logInAs = () => {
    localStorage.setItem('adminLoggedInAs', user.employeeId)
    window.location.reload()
  }

  const grantAdmin = () => {
    dispatch(editUserAction({ ...user, isAdmin: true }))
  }

  const removeAdmin = () => {
    dispatch(editUserAction({ ...user, isAdmin: false }))
  }

  const grantGrader = () => {
    dispatch(editUserAction({ ...user, isGrader: true }))
  }

  const removeGrader = () => {
    dispatch(editUserAction({ ...user, isGrader: false }))
  }

  const handleDeleteUser = () => dispatch(deleteUser(user.id))

  const GraderBadge = () => {
    return user.isGrader ? (
      <Popup
        trigger={
          <Icon
            data-cy={`${user.name}-is-grader`}
            name="check"
            color="green"
            size="large"
          />
        }
        content={
          <Button
            data-cy="remove-grader-confirm"
            color="red"
            content="Remove grader role"
            onClick={() => removeGrader()}
          />
        }
        on="click"
        position="top center"
      />
    ) : (
      <Popup
        trigger={
          <Icon
            data-cy={`${user.name}-not-grader`}
            name="close"
            color="red"
            size="large"
          />
        }
        content={
          <Button
            data-cy="grant-grader-confirm"
            color="green"
            content="Grant grader role"
            onClick={() => grantGrader()}
          />
        }
        on="click"
        position="top center"
      />
    )
  }

  const AdminBadge = () => {
    return user.isAdmin ? (
      <Popup
        trigger={
          <Icon
            data-cy={`${user.name}-is-admin`}
            name="check"
            color="green"
            size="large"
          />
        }
        content={
          <Button
            data-cy="remove-admin-confirm"
            color="red"
            content="Remove admin role"
            onClick={() => removeAdmin()}
          />
        }
        on="click"
        position="top center"
      />
    ) : (
      <Popup
        trigger={
          <Icon
            data-cy={`${user.name}-not-admin`}
            name="close"
            color="red"
            size="large"
          />
        }
        content={
          <Button
            data-cy="grant-admin-confirm"
            color="green"
            content="Grant admin role"
            onClick={() => grantAdmin()}
          />
        }
        on="click"
        position="top center"
      />
    )
  }

  const DeleteUser = () =>
    <Popup
      trigger={
        <Button
          data-cy={`${user.name}-delete`}
          icon="trash"
          color="red"
          size="large"
          content="Delete user"
          basic
        />
      }
      content={
        <Button
          data-cy="delete-user-confirm"
          color="red"
          content="Are you sure?"
          size="massive"
          onClick={() => handleDeleteUser()}
        />
      }
      on="click"
      position="top center"
    />

  const EditUser = () => <Modal
    trigger={
      <Button
        data-cy={`${user.name}-delete`}
        icon="edit"
        color="yellow"
        size="large"
        content="Edit user"
        onClick={() => setShowForm(true)}
        basic />
    }
    basic
    open={showForm}
    onClose={() => setShowForm(false)}
  >
    <Modal.Content>
      <UserForm user={user} close={() => setShowForm(false)} />
    </Modal.Content>
  </Modal>

  return (
    <Grid.Row>
      <Grid.Column width={8}>{user.name} ({user.uid})</Grid.Column>
      <Grid.Column textAlign="center" width={1}>
        <GraderBadge />
      </Grid.Column>
      <Grid.Column textAlign="center" width={1}>
        <AdminBadge />
      </Grid.Column>
      <Grid.Column textAlign="center" width={3}>
        <EditUser />
        <DeleteUser />
      </Grid.Column>
      <Grid.Column width={1}>
        <Icon onClick={logInAs} size="large" name="sign-in" />
      </Grid.Column>
    </Grid.Row>
  )
}
