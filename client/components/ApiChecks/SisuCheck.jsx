import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Input, Header, Form } from 'semantic-ui-react'
import { checkSisu } from '@client/utils/redux/apiCheckReducer'
import SisuInstance from '@client/components/ApiChecks/SisuInstance'

export default () => {
  const dispatch = useDispatch()
  const { sisu } = useSelector((state) => state.apiChecks)
  const [data, setData] = useState({ course: '' })
  const [active, setActive] = useState(-1)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkSisu(data.course))
  }

  const countEnrollments = (realisations) => realisations.reduce((sum, r) => sum + r.enrollments.length, 0)

  const getRealisationCards = () => {
    if (!sisu) return ''
    const realisations = sisu.realisations
    if (!realisations || !realisations.length) return <b>No realisations found from Sisu with the course code</b>

    const kept = realisations.filter((r) => !r.droppedByCron)

    return (
      <div>
        <p>
          Cron uses {kept.length}/{realisations.length} realisations, {countEnrollments(kept)}/
          {countEnrollments(realisations)} enrollments (activityPeriod cutoff {sisu.cutoff})
        </p>
        {realisations.map((realisation, index) => (
          <SisuInstance
            key={`${realisation.activityPeriod?.startDate}+${index}`}
            realisation={realisation}
            index={index}
            active={active}
            setActive={setActive}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Header>Sisu enrolment check</Header>
      <Form onSubmit={handleCheck} style={{ marginBottom: '100px' }}>
        <Form.Field
          control={Input}
          label="Enter course code"
          action={{
            icon: 'search',
            color: 'blue',
            labelPosition: 'right',
            content: 'Check'
          }}
          value={data.course || ''}
          placeholder="TKT21027"
          onChange={(e) => setData({ course: e.target.value })}
        />
      </Form>
      {getRealisationCards()}
    </div>
  )
}
