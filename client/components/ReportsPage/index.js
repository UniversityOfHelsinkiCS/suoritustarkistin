import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import RawReports from 'Components/ReportsPage/RawReports'
import Reports from 'Components/ReportsPage/Reports'
import SisReports from 'Components/ReportsPage/SisReports'
import EnrolmentLimbo from 'Components/ReportsPage/EnrolmentLimbo'
import {
  getAllReportsAction,
  getUsersReportsAction
} from 'Utilities/redux/reportsReducer'
import {
  sisGetAllReportsAction,
  sisGetUsersReportsAction
} from 'Utilities/redux/sisReportsReducer'
import { Menu, Icon, Tab } from 'semantic-ui-react'
import { getAllCoursesAction } from '../../utils/redux/coursesReducer'

export default ({match}) => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)
  const reports = useSelector((state) => state.reports)
  const sisReports = useSelector((state) => state.sisReports)

  useEffect(() => {
    if (user.adminMode) {
      dispatch(getAllReportsAction())
      dispatch(getAllCoursesAction())
      dispatch(sisGetAllReportsAction())
    } else {
      dispatch(getUsersReportsAction(user.id))
      dispatch(sisGetUsersReportsAction(user.id))
    }
  }, [user])

  let panes = [
    {
      menuItem: (
        <Menu.Item key="pretty" data-cy="pretty-reports-tab">
          <Icon name="tasks" />
          Pretty
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <Reports />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="raw" data-cy="raw-reports-tab">
          <Icon name="file alternate outline" />
          Raw
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <RawReports
            reports={{
              ...reports,
              data: reports.data.filter((report) => report.reporterId)
            }}
          />
        </Tab.Pane>
      )
    }
  ]

  if (user.adminMode) {
    panes = [...panes, {
      menuItem: (
        <Menu.Item key="mooc" data-cy="mooc-reports-tab">
          <Icon name="file alternate outline" />
          Autogenerated MOOC
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <RawReports
            reports={{
              ...reports,
              data: reports.data.filter((report) => !report.reporterId)
            }}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="sis-manual" data-cy="sis-reports-tab">
          <Icon name="file alternate" />
          SIS Reports
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <SisReports
            user={user}
            reports={sisReports.data.filter((entry) => entry.reporterId)}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="sis-mooc" data-cy="sis-auto-reports-tab">
          <Icon name="file alternate" />
          SIS Autogenerated Reports
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <SisReports
            user={user}
            reports={sisReports.data.filter((entry) => !entry.reporterId)}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="sis-limbo" data-cy="sis-limbo">
          <Icon name="sync" />
          Enrolment limbo
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <EnrolmentLimbo
            rawEntries={sisReports.data.filter((rawEntry) => rawEntry.entry.missingEnrolment)}
          />
        </Tab.Pane>
      )
    }
    ]
  }

  return <Tab panes={panes} defaultActiveIndex={match.params.activeBatch ? 3 : 0} />
}
