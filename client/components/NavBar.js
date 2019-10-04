import React from 'react'
import { Button } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutAction } from 'Utilities/redux/userReducer'
import { images } from 'Utilities/common'
import { Link } from 'react-router-dom'

const headerStyle = {
  position: 'absolute',
  top: '11px',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

const userStyle = {
  margin: '16px',
  float: 'right'
}

export default () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const handleLogout = () => {
    dispatch(logoutAction())
  }
  return (
    <div className="navbar">
      <img src={images.toska_color} style={{ height: '100%' }} alt="tosca" />
      <h1 style={headerStyle}>SUORITUSTARKISTIN</h1>
      {user.data ? (
        <div style={{ float: 'right' }}>
          <div style={userStyle}>
            <Button
              content={`Log out ${user.data.name}`}
              icon="sign-out"
              labelPosition="right"
              onClick={handleLogout}
            />
          </div>
          <div style={userStyle}>
            <Link to={'/reports'}>
              <Button content={`View reports`} />
            </Link>
          </div>
          <div style={userStyle}>
            <Link to={'/'}>
              <Button content={`New report`} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
