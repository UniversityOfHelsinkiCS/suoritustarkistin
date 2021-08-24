import React from 'react'
import { images } from 'Utilities/common'


export default () => (
  <div className="footer">
    <div style={{ margin: '25px', float: 'left' }}>
      Contact support: grp-toska@cs.helsinki.fi
    </div>
    <img
      src={images.toska_color}
      style={{ height: '100%', float: 'right' }}
      alt="tosca"
    />
  </div>
)
