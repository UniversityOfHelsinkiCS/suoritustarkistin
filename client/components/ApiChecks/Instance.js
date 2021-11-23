import React from 'react'
import { useSelector } from 'react-redux'
import { Accordion, Card } from 'semantic-ui-react'


export default ({ instance, active, setActive }) => {
  const { eduweb } = useSelector((state) => state.apiChecks)

  const getCardRow = (instance, attribute) => (
    <div>
      <b>{attribute}: </b>{instance[attribute]}
    </div>
  )
  
  const getEnrollments = (url) => {
    const enrollments = eduweb?.enrollments[url]
    if (!enrollments || !enrollments.length) return 'Instance has no enrollments'

    return (
      <div>
        {enrollments.map((s) => (
          <div>
            {getCardRow(s, 'onro')}
            {getCardRow(s, 'email')}
            {getCardRow(s, 'mooc')}
            ------------------------
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card style={{ width: '1000px', padding: '20px' }}>
      {getCardRow(instance, 'oodi_id')}
      {getCardRow(instance, 'url')}
      {getCardRow(instance, 'alkupvm')}
      {getCardRow(instance, 'loppupvm')}
      <Accordion fluid styled style={{ marginTop: '20px'}}>
        <Accordion.Title
          style={{ backgroundColor: "#2185d0", color: 'white' }}
          active={active === instance.url}
          onClick={() => setActive(active === instance.url ? -1 : instance.url)}
        >
          Enrollments
        </Accordion.Title>
        <Accordion.Content active={active === instance.url}>
          {getEnrollments(instance.url)}
        </Accordion.Content>
      </Accordion>
    </Card>
  )
}