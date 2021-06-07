import React, { useEffect, useState } from 'react'
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
  sisGetUsersReportsAction,
  openReport
} from 'Utilities/redux/sisReportsReducer'
import { Menu, Icon, Tab, Label } from 'semantic-ui-react'
import { getAllCoursesAction, getUsersCoursesAction } from '../../utils/redux/coursesReducer'

export default ({ match }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)
  const reports = useSelector((state) => state.reports)
  const sisReports = useSelector((state) => state.sisReports)

  useEffect(() => {
    if (user.adminMode) {
      dispatch(getAllCoursesAction())
      dispatch(sisGetAllReportsAction())
    } else {
      dispatch(sisGetUsersReportsAction(user.id))
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersReportsAction(user.id))
    }
  }, [user])

  useEffect(() => {
    if (match && match.params && loading && sisReports.data.length) {
      const { activeBatch } = match.params
      if (activeBatch) {
        setLoading(false)
        dispatch(openReport(activeBatch))
        const isAutoReport = sisReports.data
          .filter((r) => r.batchId === activeBatch)
          .some((r) => !r.reporterId)
        if (isAutoReport)
          setActiveTab(1)
      }
    }
  }, [match.params, sisReports.data, loading])

  const handleTabChange = (_, { activeIndex }) => {
    // Fetch old reports only if tab is opened
    setActiveTab(activeIndex)
    if (user.adminMode && activeIndex > 2 && !reports.data.length)
      dispatch(getAllReportsAction())
  }

  const manualReportsCount = new Set(sisReports.data
    .filter((entry) => entry.reporterId && !entry.entry.sent && !entry.entry.missingEnrolment)
    .map((entry) => entry.batchId)).size
  let panes = [
    {
      menuItem: (
        <Menu.Item key="sis-manual" data-cy="sis-reports-tab">
          {manualReportsCount && activeTab !== 0
            ? <Label color='red' style={{ marginLeft: 0, marginRight: '1em' }} circular>{manualReportsCount}</Label>
            : <Icon name="file alternate" />}
          SIS Reports
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane loading={sisReports ? sisReports.pending : true}>
          <SisReports
            user={user}
            reports={sisReports.data.filter((entry) => entry.reporterId)}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="pretty" data-cy="pretty-reports-tab">
          <Icon name="tasks" />
          OODI Reports
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <Reports />
        </Tab.Pane>
      )
    },
  ]

  if (user.adminMode) {
    const autoReportsCount = new Set(sisReports.data
      .filter((entry) => !entry.reporterId && !entry.entry.sent && !entry.entry.missingEnrolment)
      .map((entry) => entry.batchId)).size
    panes = [...panes, {
      menuItem: (
        <Menu.Item key="sis-mooc" data-cy="sis-auto-reports-tab">
          {autoReportsCount && activeTab !== 1
            ? <Label color='red' style={{ marginLeft: 0, marginRight: '1em' }} circular>{autoReportsCount}</Label>
            : <Icon name="file alternate" />}
          SIS Autogenerated Reports
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane loading={sisReports ? sisReports.pending : true}>
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
        <Tab.Pane loading={sisReports ? sisReports.pending : true}>
          <EnrolmentLimbo
            rawEntries={sisReports.data.filter((rawEntry) => rawEntry.entry.missingEnrolment)}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="pretty" data-cy="pretty-reports-tab">
          <Icon name="tasks" />
          Pretty (OODI)
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
          Raw (OODI)
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
    },
    {
      menuItem: (
        <Menu.Item key="mooc" data-cy="mooc-reports-tab">
          <Icon name="file alternate outline" />
          Autogenerated MOOC (OODI)
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
    }
    ]
  }

  return <Tab panes={panes} onTabChange={handleTabChange} activeIndex={activeTab} />
}
