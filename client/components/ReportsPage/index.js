import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import RawReports from 'Components/ReportsPage/RawReports'
import Reports from 'Components/ReportsPage/Reports'
import {
  getAllReportsAction,
  getUsersReportsAction
} from 'Utilities/redux/reportsReducer'
import { Menu, Icon, Tab } from 'semantic-ui-react'

export default () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)

  useEffect(() => {
    user.adminMode
      ? dispatch(getAllReportsAction())
      : dispatch(getUsersReportsAction(user.id))
  }, [user])

  const panes = [
    {
      menuItem: (
        <Menu.Item key="pretty" data-cy="prettyReports">
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
        <Menu.Item key="raw" data-cy="rawReports">
          <Icon name="file alternate outline" />
          Raw
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <RawReports />
        </Tab.Pane>
      )
    }
  ]
  return <Tab panes={panes} />
}
