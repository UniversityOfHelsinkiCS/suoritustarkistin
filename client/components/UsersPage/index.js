import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAllUsersAction } from 'Utilities/redux/usersReducer'
import Message from 'Components/Message'
import UserTable from 'Components/UsersPage/UserTable'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllUsersAction())
  }, [])

  return (
    <>
      <Message />
      <UserTable />
    </>
  )
}
