import JobsTable from '@client/components/AutomatedReportsPage/Mooc/JobsTable'
import NewJob from '@client/components/AutomatedReportsPage/Mooc/NewJob'
import Message from '@client/components/Message'
import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { getAllGradersAction } from '@client/utils/redux/gradersReducer'
import { getAllJobsAction } from '@client/utils/redux/moocJobsReducer'
import React, { useEffect } from 'react'
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
      <NewJob />
      <Message />
      <JobsTable />
    </>
  )
}
