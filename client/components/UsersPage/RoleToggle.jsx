import ConfirmPopover from '@client/components/ConfirmPopover'
import { BooleanIcon } from '@client/components/DataTable'
import { editUserAction } from '@client/utils/redux/usersReducer'
import { Button } from '@mui/material'
import { useDispatch } from 'react-redux'

export default ({ user, roleKey, label }) => {
  const dispatch = useDispatch()
  const granted = user[roleKey]
  const cyName = roleKey === 'isGrader' ? 'grader' : 'admin'

  return (
    <ConfirmPopover
      trigger={(open) => (
        <BooleanIcon
          value={granted}
          data-cy={`${user.name}-${granted ? 'is' : 'not'}-${cyName}`}
          onClick={open}
          sx={{ cursor: 'pointer' }}
        />
      )}
    >
      {(close) => (
        <Button
          variant="contained"
          data-cy={granted ? `remove-${cyName}-confirm` : `grant-${cyName}-confirm`}
          color={granted ? 'error' : 'success'}
          onClick={() => {
            dispatch(editUserAction({ ...user, [roleKey]: !granted }))
            close()
          }}
        >
          {granted ? `Remove ${label} role` : `Grant ${label} role`}
        </Button>
      )}
    </ConfirmPopover>
  )
}
