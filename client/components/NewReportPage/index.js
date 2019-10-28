import React from 'react'
import ReportDisplay from 'Components/NewReportPage/ReportDisplay'
import InputOptions from 'Components/NewReportPage/InputOptions'
import InputSelector from 'Components/NewReportPage/InputSelector'
import UserGuide from 'Components/NewReportPage/UserGuide'
import Message from 'Components/Message'

export default () => {
  return (
    <div>
      <UserGuide />
      <Message />
      <InputSelector />
      <InputOptions />
      <ReportDisplay />
    </div>
  )
}
