import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { getAllJobsAction } from 'Utilities/redux/moocJobsReducer'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import JobsTable from 'Components/AutomatedReportsPage/Mooc/JobsTable'
import NewJob from 'Components/AutomatedReportsPage/Mooc/NewJob'
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
