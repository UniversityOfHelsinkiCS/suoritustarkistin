import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginAction, pingAction } from 'Utilities/redux/userReducer'
import NavBar from 'Components/NavBar'
import Router from 'Components/Router'
import Footer from 'Components/Footer'
import { Header } from 'semantic-ui-react'

export default () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(loginAction())
  }, [])

  useEffect(() => {
    setInterval(() => {
      dispatch(pingAction())
    }, 60 * 1000) // One minute
  }, [])

  // Login failed, because no employeenumber
  if(user.error && user.errorCode === 1) return (
    <div style={{position:"absolute",left:"50%", top:"50%", transform:"translate(-50%,-50%)"}} >
      <Header as="h1">
        This service is for employees only.
      </Header>
      <span>To use the service, you need to have an employee number.</span>
    </div>
  )

  if (!user.data) return null

  return (
    <div>
      <NavBar />
      <Router />
      <Footer />
    </div>
  )
}
