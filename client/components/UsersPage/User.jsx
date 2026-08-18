import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Box, Button, Dialog, DialogContent, Popover, TableCell, TableRow, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LoginIcon from '@mui/icons-material/Login'
import moment from 'moment'

import UserForm from '@client/components/UsersPage/UserForm'
import { deleteUser, editUserAction } from '@client/utils/redux/usersReducer'

/**
 * Semantic's on="click" Popup held interactive content, which is a Popover in MUI.
 * All the role toggles and the delete confirmation share this shape.
 */
const ConfirmPopover = ({ trigger, children }) => {
  const [anchor, setAnchor] = useState(null)

  return (
    <>
      {trigger((e) => setAnchor(e.currentTarget))}
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>{children(() => setAnchor(null))}</Box>
      </Popover>
    </>
  )
}

export default ({ user }) => {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)

  const logInAs = () => {
    localStorage.setItem('adminLoggedInAs', user.employeeId)

    if (process.env.NODE_ENV === 'production') window.location.href = '/suoritustarkistin'
    else if (process.env.NODE_ENV === 'staging') window.location.href = '/suotar'
    else window.location.href = '/'
  }

  const setRole = (roleKey, value) => () => dispatch(editUserAction({ ...user, [roleKey]: value }))

  const handleDeleteUser = () => dispatch(deleteUser(user.id))

  const RoleBadge = ({ roleKey, label }) => {
    const granted = user[roleKey]
    const cyName = roleKey === 'isGrader' ? 'grader' : 'admin'

    return (
      <ConfirmPopover
        trigger={(open) =>
          granted ? (
            <CheckIcon
              data-cy={`${user.name}-is-${cyName}`}
              color="success"
              onClick={open}
              sx={{ cursor: 'pointer' }}
            />
          ) : (
            <CloseIcon data-cy={`${user.name}-not-${cyName}`} color="error" onClick={open} sx={{ cursor: 'pointer' }} />
          )
        }
      >
        {(close) => (
          <Button
            variant="contained"
            data-cy={granted ? `remove-${cyName}-confirm` : `grant-${cyName}-confirm`}
            color={granted ? 'error' : 'success'}
            onClick={() => {
              setRole(roleKey, !granted)()
              close()
            }}
          >
            {granted ? `Remove ${label} role` : `Grant ${label} role`}
          </Button>
        )}
      </ConfirmPopover>
    )
  }

  return (
    <TableRow>
      <TableCell>
        {user.name} ({user.uid})
      </TableCell>
      <TableCell align="center">
        <RoleBadge roleKey="isGrader" label="grader" />
      </TableCell>
      <TableCell align="center">
        <RoleBadge roleKey="isAdmin" label="admin" />
      </TableCell>
      <TableCell align="center">
        {user.lastLogin ? (
          moment(user.lastLogin).format('DD.MM.YYYY')
        ) : (
          <span style={{ color: 'gray' }}>Not saved</span>
        )}
      </TableCell>
      <TableCell align="center">
        <Button
          data-cy={`${user.name}-edit`}
          variant="outlined"
          color="warning"
          startIcon={<EditIcon />}
          onClick={() => setShowForm(true)}
          sx={{ mr: 1 }}
        >
          Edit user
        </Button>
        <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
          <DialogContent>
            <UserForm user={user} close={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
        <ConfirmPopover
          trigger={(open) => (
            <Button
              data-cy={`${user.name}-delete`}
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={open}
            >
              Delete user
            </Button>
          )}
        >
          {(close) => (
            <>
              <Typography sx={{ mb: 1 }}>
                This does not delete the reports by the user. But{' '}
                <strong>the reports will no longer have any mention of the user</strong>
              </Typography>
              <Button
                data-cy="delete-user-confirm"
                variant="contained"
                color="error"
                onClick={() => {
                  handleDeleteUser()
                  close()
                }}
              >
                Yes, delete the user
              </Button>
            </>
          )}
        </ConfirmPopover>
      </TableCell>
      <TableCell>
        <LoginIcon onClick={logInAs} sx={{ cursor: 'pointer' }} />
      </TableCell>
    </TableRow>
  )
}
