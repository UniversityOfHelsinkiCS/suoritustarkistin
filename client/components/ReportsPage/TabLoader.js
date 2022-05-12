import React from 'react'
import { Loader } from 'semantic-ui-react'

const TabLoader = () => {
  return (
    <div style={{ height: '80px' }}>
      <Loader size="big" active />
    </div>
  )
}

export default TabLoader
