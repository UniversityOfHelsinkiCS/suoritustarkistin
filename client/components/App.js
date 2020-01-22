import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginAction, pingAction } from 'Utilities/redux/userReducer'
import NavBar from 'Components/NavBar'
import Router from 'Components/Router'
import Footer from 'Components/Footer'

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

  if (!user.data) return null

  return (
    <div>
      <NavBar />
      <Router />
      <Footer />
    </div>
  )
}
