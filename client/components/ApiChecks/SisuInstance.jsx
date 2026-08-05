import React from 'react'
import { Accordion, Card, Label } from 'semantic-ui-react'

export default ({ realisation, index, active, setActive }) => {
  const { activityPeriod, enrollments, droppedByCron } = realisation

  const getCardRow = (label, value) => (
    <div>
      <b>{label}: </b>
      {value || 'null'}
    </div>
  )

  const getEnrollments = () => {
    if (!enrollments.length) return <b>Realisation has no enrollments</b>

    return (
      <div>
        {enrollments.map((e, i) => (
          <div key={`${e.person?.studentNumber}+${i}`}>
            {getCardRow('studentNumber', e.person?.studentNumber)}
            {getCardRow('email', e.person?.primaryEmail)}
            {getCardRow('mooc', e.person?.secondaryEmail)}
            ------------------------
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card fluid style={{ padding: '20px' }}>
      {getCardRow('startDate', activityPeriod?.startDate)}
      {getCardRow('endDate', activityPeriod?.endDate)}
      {getCardRow('enrollments', enrollments.length)}
      <div style={{ marginTop: '10px' }}>
        <Label color={droppedByCron ? 'red' : 'green'}>
          {droppedByCron ? 'Dropped by cron (activityPeriod)' : 'Used by cron'}
        </Label>
      </div>
      <Accordion fluid styled style={{ marginTop: '20px' }}>
        <Accordion.Title
          style={{ backgroundColor: '#2185d0', color: 'white' }}
          active={active === index}
          onClick={() => setActive(active === index ? -1 : index)}
        >
          Enrollments
        </Accordion.Title>
        <Accordion.Content active={active === index}>{getEnrollments()}</Accordion.Content>
      </Accordion>
    </Card>
  )
}
