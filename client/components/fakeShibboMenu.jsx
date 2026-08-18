import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import PeopleIcon from '@mui/icons-material/People'
import { getHeaders, possibleUsers, setHeaders } from '@client/utils/fakeShibboleth'
import { loginAction } from '@client/utils/redux/userReducer'
import { inProduction } from '@client/utils/common'

export default () => {
  const [employeeNumber, setEmployeenumber] = useState(getHeaders().employeeNumber)
  const [anchorEl, setAnchorEl] = useState(null)
  const dispatch = useDispatch()

  const chooseUser = (number) => {
    setEmployeenumber(number)
    setHeaders(number)
    setAnchorEl(null)
    dispatch(loginAction())
  }
  if (inProduction) return null

  return (
    <>
      <IconButton title="Fakeshibbo" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <PeopleIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {possibleUsers.map((u) => (
          <MenuItem
            key={u.employeeNumber}
            data-cy={`fakeshibbo-${u.employeeNumber}`}
            onClick={() => chooseUser(u.employeeNumber)}
            disabled={employeeNumber === u.employeeNumber}
          >
            {u.employeeNumber}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
