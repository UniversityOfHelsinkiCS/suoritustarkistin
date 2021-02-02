import React, { useState } from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { sisHandleBatchDeletionAction, openReport } from 'Utilities/redux/sisReportsReducer'

export default ({ batchId }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)

  const deleteBatch = () => {
    dispatch(sisHandleBatchDeletionAction(batchId))
    dispatch(openReport(batchId))
  }

  return (
    <Popup
        open={open && openAccordions.includes(batchId)}
        trigger={
          <Button
            negative
            content="Delete completions"
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
              Please note that deleting the completion-report here, will not affect already sent completions in SIS.
            </p>
            <Button
              style={{ margin: '5px 2px' }}
              negative
              data-cy={`delete-batch-${batchId}`}
              onClick={deleteBatch}
              disabled={!batchId}
              content="Yes, delete completions"
            />
          </div>
        }
        on="click"
        position="top center"
      />
  )
}