import React from 'react'
import { useSelector } from 'react-redux'
import AllReports from 'Components/ReportsPage/AllReports'
import UserReports from 'Components/ReportsPage/UserReports'

export default () => {
  const user = useSelector((state) => state.user.data)
  
  return user.isAdmin ? <AllReports /> : <UserReports />
}