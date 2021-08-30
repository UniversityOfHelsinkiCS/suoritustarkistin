import React, { useState } from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'

import { handleEntryDeletionAction } from 'Utilities/redux/sisReportsReducer'


export default ({ rawEntryId, batchId }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)

  const deleteEntry = () => {
    dispatch(handleEntryDeletionAction(rawEntryId))
  }

  return (
    <Popup
      open={open && openAccordions.includes(batchId)}
      trigger={
        <Button
          negative
          content="Delete"
          data-cy="report-delete-entry-button"
          disabled={!batchId}
          onClick={() => setOpen(true)}
        />
      }
      onUnmount={() => setOpen(false)}
      hideOnScroll
      content={
        <div className="delete-popup">
          <p>
            <strong>
                Are you sure?
            </strong>
          </p>
          <p style={{ padding: '5px 2px' }}>
              Please note that deleting the completion here, will not affect completions already sent to SIS.
          </p>
          <Button
            style={{ margin: '5px 2px' }}
            negative
            data-cy="report-delete-entry-confirm"
            onClick={deleteEntry}
            disabled={!rawEntryId}
            content="Yes, delete completions"
          />
        </div>
      }
      on="click"
      position="top center"
    />
  )
}
