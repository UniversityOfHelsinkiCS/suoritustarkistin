import InputSelector from '@client/components/NewReportPage/InputSelector'
import NewReportTable from '@client/components/NewReportPage/NewReportTable'
import React from 'react'
import { useSelector } from 'react-redux'

export default () => {
  const newRawEntries = useSelector((state) => state.newRawEntries)
  if (newRawEntries.entriesToConfirm && newRawEntries.entriesToConfirm.rows)
    return (
      <NewReportTable rows={newRawEntries.entriesToConfirm.rows} batchId={newRawEntries.entriesToConfirm.batchId} />
    )
  return <InputSelector />
}
