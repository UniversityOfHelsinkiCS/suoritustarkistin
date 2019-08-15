import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginAction } from 'Utilities/redux/userReducer'
import NavBar from 'Components/NavBar'
import Router from 'Components/Router'
import Footer from 'Components/Footer'

export default () => {
  const dispatch = useDispatch()
  dispatch(loginAction())
  const user = useSelector((state) => state.user)
  if (!user.data) {
    return null
  } else {
    return (
      <div>
        <NavBar />
        <Router />
        <Footer />
      </div>
    )
  }
}
