import EditJobForm from '@client/components/AutomatedReportsPage/Mooc/EditJobForm'
import { ConfirmButton } from '@client/components/ConfirmPopover'
import { RowActions } from '@client/components/DataTable'
import FormDialog from '@client/components/FormDialog'
import { deleteJobAction, runJobAction } from '@client/utils/redux/moocJobsReducer'
import { Button } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

export default ({ job }) => {
  const dispatch = useDispatch()
  const pending = useSelector((state) => state.moocJobs.pending)

  return (
    <RowActions>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" size="small" data-cy="edit-job" disabled={pending} onClick={open}>
            Edit
          </Button>
        )}
      >
        {(close) => <EditJobForm job={job} close={close} />}
      </FormDialog>
      <Button
        variant="contained"
        size="small"
        color="secondary"
        data-cy={`create-report-${job.courseCode}`}
        disabled={pending}
        onClick={() => dispatch(runJobAction(job.id))}
      >
        Create report
      </Button>
      <ConfirmButton
        dataCy={`delete-job-${job.courseCode}`}
        cancelDataCy="delete-job-cancel"
        confirmDataCy="delete-job-confirm"
        label="Delete"
        confirmLabel="Really delete"
        disabled={pending}
        onConfirm={() => dispatch(deleteJobAction(job.id))}
      />
    </RowActions>
  )
}
