import React from 'react'
import { Route, Switch } from 'react-router-dom'
import ProtectedRoute from '@client/components/ProtectedRoute'
import ApiChecks from '@client/components/ApiChecks'
import NewReportPage from '@client/components/NewReportPage'
import ReportsPage from '@client/components/ReportsPage'
import CoursesPage from '@client/components/CoursesPage'
import UsersPage from '@client/components/UsersPage'
import AutomatedReportsPage from '@client/components/AutomatedReportsPage'
import UnauthorizedPage from '@client/components/UnauthorizedPage'
import SandboxPage from '@client/components/SandboxPage'

// HACK to make component full page width or narrow
const Wrap = ({ childComponent: ChildComponent, narrow }) => (
  <div className={narrow ? `sitecontent-narrow` : 'sitecontent'}>
    <ChildComponent />
  </div>
)

export default () => (
  <Switch>
    <ProtectedRoute exact path="/" component={Wrap} childComponent={NewReportPage} narrow />
    <ProtectedRoute exact path="/reports" component={Wrap} childComponent={ReportsPage} narrow />
    <ProtectedRoute exact path="/reports/sisu/:activeBatch" component={Wrap} childComponent={ReportsPage} narrow />
    <ProtectedRoute exact path="/courses" component={Wrap} childComponent={CoursesPage} />
    <ProtectedRoute exact path="/users" component={Wrap} childComponent={UsersPage} narrow />
    <ProtectedRoute exact path="/automated-reports" component={Wrap} childComponent={AutomatedReportsPage} />
    <ProtectedRoute exact path="/apichecks" component={Wrap} childComponent={ApiChecks} narrow />
    <ProtectedRoute exact path="/sandbox" component={Wrap} childComponent={SandboxPage} narrow />
    <Route exact path="/unauthorized" component={UnauthorizedPage} />
    <Route path="*" render={() => <div>Page not found!</div>} />
  </Switch>
)
