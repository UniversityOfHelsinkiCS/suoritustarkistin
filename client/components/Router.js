import React from 'react'
import { Route, Switch } from 'react-router-dom'
import ProtectedRoute from 'Components/ProtectedRoute'
import NewReportPage from 'Components/NewReportPage'
import ReportsPage from 'Components/ReportsPage'
import CoursesPage from 'Components/CoursesPage'
import UsersPage from 'Components/UsersPage'
import AutomatedReportsPage from 'Components/AutomatedReportsPage'
import UnauthorizedPage from 'Components/UnauthorizedPage'
import SandboxPage from 'Components/SandboxPage'


export default () => (
  <div className="sitecontent">
    <Switch>
      <ProtectedRoute exact path="/" component={NewReportPage} />
      <ProtectedRoute exact path="/reports" component={ReportsPage} />
      <ProtectedRoute exact path="/reports/sisu/:activeBatch" component={ReportsPage} />
      <ProtectedRoute exact path="/courses" component={CoursesPage} />
      <ProtectedRoute exact path="/users" component={UsersPage} />
      <ProtectedRoute exact path="/automated-reports" component={AutomatedReportsPage} />
      <ProtectedRoute exact path="/sandbox" component={SandboxPage} />
      <Route exact path="/unauthorized" component={UnauthorizedPage} />
      <Route path="*" render={() => <div>Page not found!</div>} />
    </Switch>
  </div>
)
