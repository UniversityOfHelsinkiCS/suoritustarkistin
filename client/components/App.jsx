import Footer from '@client/components/Footer'
import MaintenanceView, { MaintenanceMessage } from '@client/components/MaintenanceView'
import NavBar from '@client/components/NavBar'
import Router from '@client/components/Router'
import { getStatus } from '@client/utils/redux/systemStatusReducer'
import { loginAction, pingAction } from '@client/utils/redux/userReducer'
import { Typography } from '@mui/material'
import * as Sentry from '@sentry/react'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const systemStatus = useSelector((state) => state.systemStatus)

  useEffect(() => {
    Sentry.setUser({ ...user.data })
  }, [user])

  useEffect(() => {
    dispatch(getStatus())
    dispatch(loginAction())
    setInterval(() => {
      dispatch(pingAction())
    }, 60 * 1000) // One minute
  }, [dispatch])

  // Login failed, because no employeenumber
  if (user.error && user.errorCode === 1)
    return (
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          This service is for employees only.
        </Typography>
        <span>To use the service, you need to have an employee number.</span>
      </div>
    )

  if (!user.data) return null

  const renderContent = () => {
    if (user.data.isAdmin)
      return (
        <>
          {systemStatus.inMaintenance ? <MaintenanceMessage /> : null}
          <Router />
        </>
      )
    return systemStatus.inMaintenance ? <MaintenanceView /> : <Router />
  }

  return (
    <div>
      <NavBar />
      {renderContent()}
      <Footer />
    </div>
  )
}
