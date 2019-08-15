import React from 'react'
import { useSelector } from 'react-redux'
import { images } from 'Utilities/common'

const headerStyle = {
  position: 'absolute',
  top: '11px',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

const nameStyle = {
  margin: '25px',
  float: 'right'
}

export default () => {
  const user = useSelector((state) => state.user)
  return (
    <div className="navbar">
      <img src={images.toska_color} style={{ height: '100%' }} alt="tosca" />
      <h1 style={headerStyle}>SUORITUSTARKISTIN</h1>
      {user.data ? (
        <div style={nameStyle}>Logged in as {user.data.name}</div>
      ) : null}
    </div>
  )
}
