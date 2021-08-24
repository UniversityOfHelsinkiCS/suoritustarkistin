import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import NavBar from 'Components/NavBar'
import Router from 'Components/Router'
import Footer from 'Components/Footer'
import MaintenanceView, { MaintenanceMessage } from 'Components/MaintenanceView'
import { loginAction, pingAction } from 'Utilities/redux/userReducer'
import { getStatus } from 'Utilities/redux/systemStatusReducer'


export default withRouter(({history}) => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const systemStatus = useSelector((state) => state.systemStatus)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if(user && user.data && user.data.isAdmin && !redirected && process.env.NODE_ENV === 'production' && history.location.pathname === '/suoritustarkistin') {
      setRedirected(true)
      history.push('/reports')
    }
  }, [redirected, user, history])

  useEffect(() => {
    dispatch(getStatus())
    dispatch(loginAction())
    setInterval(() => {
      dispatch(pingAction())
    }, 60 * 1000) // One minute
  }, [])

  // Login failed, because no employeenumber
  if (user.error && user.errorCode === 1) return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} >
      <Header as="h1">
        This service is for employees only.
      </Header>
      <span>To use the service, you need to have an employee number.</span>
    </div>
  )

  if (!user.data) return null

  const renderContent = () => {
    if (user.data.isAdmin)
      return <>
        {systemStatus.inMaintenance ? <MaintenanceMessage /> : null}
        <Router />
      </>
    return systemStatus.inMaintenance ? <MaintenanceView /> : <Router />
  }

  return (
    <div>
      <NavBar />
      {renderContent()}
      <Footer />
    </div>
  )
})
