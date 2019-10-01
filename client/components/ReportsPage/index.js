import React from 'react'
import { useSelector } from 'react-redux'
import AllReports from 'Components/ReportsPage/AllReports'

export default () => {
  const user = useSelector((state) => state.user.data)
  
  return user.isAdmin ? <AllReports /> : <h1>NOT ADMIN</h1>
}