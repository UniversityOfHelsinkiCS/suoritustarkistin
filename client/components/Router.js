import React from 'react'
import { Route, Switch } from 'react-router-dom'

import OnlyView from 'Components/OnlyView'
import ReportsPage from 'Components/ReportsPage'

export default () => (
  <div className="sitecontent">
    <Switch>
      <Route exact path="/" component={OnlyView} />
      <Route exact path="/reports" component={ReportsPage} />
      <Route path="*" render={() => <div>Page not found!</div>} />
    </Switch>
  </div>
)
