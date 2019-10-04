import React from 'react'
import { Route, Switch } from 'react-router-dom'

import NewReportPage from 'Components/NewReportPage'
import ReportsPage from 'Components/ReportsPage'

export default () => (
  <div className="sitecontent">
    <Switch>
      <Route exact path="/" component={NewReportPage} />
      <Route exact path="/reports" component={ReportsPage} />
      <Route path="*" render={() => <div>Page not found!</div>} />
    </Switch>
  </div>
)
