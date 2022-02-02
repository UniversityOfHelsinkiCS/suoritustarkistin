import React from 'react'
import { useSelector } from 'react-redux'

import InputSelector from 'Components/NewReportPage/InputSelector'
import NewReportTable from 'Components/NewReportPage/NewReportTable'

export default () => {
  const newRawEntries = useSelector((state) => state.newRawEntries)
  if (newRawEntries.entriesToConfirm && newRawEntries.entriesToConfirm.rows)
    return <NewReportTable
      rows={newRawEntries.entriesToConfirm.rows}
      batchId={newRawEntries.entriesToConfirm.batchId} />
  return <InputSelector />
}
