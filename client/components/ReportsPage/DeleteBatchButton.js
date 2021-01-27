import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useDispatch } from 'react-redux'
import { sisHandleBatchDeletionAction } from 'Utilities/redux/sisReportsReducer'

export default ({ batchId }) => {
  const dispatch = useDispatch()

  return (
    <Popup
        trigger={
          <Button
            negative
            content="Delete completions"
            disabled={!batchId}
          />
        }
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
              onClick={() => dispatch(sisHandleBatchDeletionAction(batchId))}
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