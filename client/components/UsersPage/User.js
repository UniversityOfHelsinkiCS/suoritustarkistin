import React from 'react'
import { useDispatch } from 'react-redux'
import { Button, Grid, Icon, Popup } from 'semantic-ui-react'
import { editUserAction } from 'Utilities/redux/usersReducer'

export default ({ user }) => {
  const dispatch = useDispatch()

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
  return (
    <Grid.Row>
      <Grid.Column width={2}>{user.name}</Grid.Column>
      <Grid.Column>{user.employeeId}</Grid.Column>
      <Grid.Column width={3}>{user.email}</Grid.Column>
      <Grid.Column textAlign="center">
        <GraderBadge />
      </Grid.Column>
      <Grid.Column textAlign="center">
        <AdminBadge />
      </Grid.Column>
      <Grid.Column />
    </Grid.Row>
  )
}
