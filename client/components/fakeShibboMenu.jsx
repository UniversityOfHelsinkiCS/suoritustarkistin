import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Dropdown } from 'semantic-ui-react'
import { getHeaders, possibleUsers, setHeaders } from '@client/utils/fakeShibboleth'
import { loginAction } from '@client/utils/redux/userReducer'
import { inProduction } from '@client/utils/common'

export default () => {
  const [employeeNumber, setEmployeenumber] = useState(getHeaders().employeeNumber)
  const dispatch = useDispatch()

  const chooseUser = ({ target }) => {
    setEmployeenumber(target.id)
    setHeaders(target.id)
    dispatch(loginAction())
  }
  if (inProduction) return null

  return (
    <Dropdown item simple icon="users" title="Fakeshibbo">
      <Dropdown.Menu>
        {possibleUsers.map((u) => (
          <Dropdown.Item
            key={u.employeeNumber}
            id={u.employeeNumber}
            onClick={chooseUser}
            disabled={employeeNumber === u.employeeNumber}
          >
            {u.employeeNumber}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
