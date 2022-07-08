import React from 'react'
import { Route, Switch } from 'react-router-dom'
import ProtectedRoute from 'Components/ProtectedRoute'
import ApiChecks from 'Components/ApiChecks'
import NewReportPage from 'Components/NewReportPage'
import ReportsPage from 'Components/ReportsPage'
import CoursesPage from 'Components/CoursesPage'
import UsersPage from 'Components/UsersPage'
import AutomatedReportsPage from 'Components/AutomatedReportsPage'
import UnauthorizedPage from 'Components/UnauthorizedPage'
import SandboxPage from 'Components/SandboxPage'

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
