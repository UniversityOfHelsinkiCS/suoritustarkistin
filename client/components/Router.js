import React from 'react'
import { Route, Switch } from 'react-router-dom'

import NewReportPage from 'Components/NewReportPage'
import ReportsPage from 'Components/ReportsPage'
import CoursesPage from 'Components/CoursesPage'
import UsersPage from 'Components/UsersPage'

export default () => (
  <div className="sitecontent">
    <Switch>
      <Route exact path="/" component={NewReportPage} />
      <Route exact path="/reports" component={ReportsPage} />
      <Route exact path="/courses" component={CoursesPage} />
      <Route exact path="/users" component={UsersPage} />
      <Route path="*" render={() => <div>Page not found!</div>} />
    </Switch>
  </div>
)
