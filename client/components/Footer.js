import React from 'react'
import { images } from 'Utilities/common'

export default () => (
  <div className="footer">
    <div style={{ margin: '25px', float: 'left' }}>
      Contact support: grp-toska@helsinki.fi
      {process.env.NODE_ENV !== 'development' && process.env.BUILT_AT ? (
        <>
          <br />
          <span style={{ opacity: 0.4 }}>Built {process.env.BUILT_AT}</span>
        </>
      ) : null}
    </div>
    <img src={images.toska_color} style={{ height: '100%', float: 'right' }} alt="tosca" />
  </div>
)
