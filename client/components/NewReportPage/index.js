import React from 'react'
import InputSelector from 'Components/NewReportPage/InputSelector'
import SisUserGuide from 'Components/NewReportPage/SisUserGuide'
import Message from 'Components/Message'

export default () => {

  return (
    <div>
      <SisUserGuide />
      <Message />
      <InputSelector />
    </div>
  )
}
