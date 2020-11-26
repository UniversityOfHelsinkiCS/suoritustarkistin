import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAllJobsAction } from 'Utilities/redux/jobsReducer'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import JobsTable from 'Components/JobsPage/JobsTable'
import NewJob from 'Components/JobsPage/NewJob'
import Message from 'Components/Message'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllJobsAction())
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [])

  return (
    <>
      <NewJob />
      <Message />
      <JobsTable />
    </>
  )
}
