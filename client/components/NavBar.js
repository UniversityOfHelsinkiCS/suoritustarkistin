import React from 'react'
import { images } from 'Utilities/common'

const headerStyle = {
  position: 'absolute',
  top: '11px',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

const contactStyle = {
  float: 'right',
  margin: '10px'
}

export default () => (
  <div className="navbar">
    <img src={images.toska_color} style={{ height: '100%' }} alt="tosca" />
    <h1 style={headerStyle}>SUORITUSTARKISTIN</h1>
    <div style={contactStyle}>Tuki: grp-toska@cs.helsinki.fi</div>
  </div>
)
