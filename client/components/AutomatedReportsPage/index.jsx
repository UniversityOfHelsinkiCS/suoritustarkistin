import JobsTable from '@client/components/AutomatedReportsPage/Mooc/JobsTable'
import NewJobForm from '@client/components/AutomatedReportsPage/Mooc/NewJobForm'
import FormDialog from '@client/components/FormDialog'
import Message from '@client/components/Message'
import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { getAllGradersAction } from '@client/utils/redux/gradersReducer'
import { getAllJobsAction } from '@client/utils/redux/moocJobsReducer'
import { Button } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllJobsAction())
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [dispatch])

  return (
    <>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" color="success" data-cy="add-job-button" onClick={open}>
            Add new job
          </Button>
        )}
      >
        {(close) => <NewJobForm close={close} />}
      </FormDialog>
      <Message />
      <JobsTable />
    </>
  )
}
