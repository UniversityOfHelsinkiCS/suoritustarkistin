import React from 'react'
import { Select, Button } from 'semantic-ui-react'

export default ({ graders, courses }) => (
  <div>
    <Select placeholder="Valitse arvostelija" options={formatGradersForSelection(graders)} />
    <Select placeholder="Valitse kurssi" options={formatCoursesForSelection(courses)} />
    <div className="ui input">
      <input type="text" placeholder="Arvostelupäivämäärä" />
    </div>
    <div className="ui input">
      <input type="text" placeholder="Arvostelijatunnus" />
    </div>
    <button className="right floated positive ui disabled button">Lähetä raportti</button>
  </div>
)

const formatGradersForSelection = data => data.map(g => ({ key: g.id, text: g.name, value: g.name }))
const formatCoursesForSelection = data => data.map(c => ({ key: c.id, text: c.courseCode, value: c.name }))
