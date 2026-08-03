import React from 'react'
import { useSelector } from 'react-redux'

import InputSelector from '@client/components/NewReportPage/InputSelector'
import NewReportTable from '@client/components/NewReportPage/NewReportTable'

export default () => {
  const newRawEntries = useSelector((state) => state.newRawEntries)
  if (newRawEntries.entriesToConfirm && newRawEntries.entriesToConfirm.rows)
    return (
      <NewReportTable rows={newRawEntries.entriesToConfirm.rows} batchId={newRawEntries.entriesToConfirm.batchId} />
    )
  return <InputSelector />
}
