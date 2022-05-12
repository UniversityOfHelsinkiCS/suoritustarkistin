import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Icon, Menu, Tab } from 'semantic-ui-react'

import { getAllJobsAction } from 'Utilities/redux/moocJobsReducer'
import { getKurkiCoursesAction } from 'Utilities/redux/kurkiReducer'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import JobsTable from 'Components/AutomatedReportsPage/Mooc/JobsTable'
import NewJob from 'Components/AutomatedReportsPage/Mooc/NewJob'
import CourseTable from 'Components/AutomatedReportsPage/Kurki/CourseTable'
import Message from 'Components/Message'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllJobsAction())
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
    dispatch(getKurkiCoursesAction())
  }, [])

  let panes = [
    {
      menuItem: (
        <Menu.Item key="kurki-jobs" data-cy="kurki-jobs-tab">
          <Icon name="folder open" />
          Kurki
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <Message />
          <CourseTable />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="mooc-jobs" data-cy="mooc-jobs-tab">
          <Icon name="file alternate outline" />
          Mooc
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <NewJob />
          <Message />
          <JobsTable />
        </Tab.Pane>
      )
    }
  ]

  return <Tab data-cy="automated-reports-tab" panes={panes} />
}
