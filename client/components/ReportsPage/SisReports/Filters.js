import React, { useEffect, useState } from 'react'
import { Form, Header, Input, Radio, Dropdown } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'

import { toggleFilterAction, setFilterAction } from 'Utilities/redux/sisReportsReducer'

const STATE_OPTIONS = [{
  text: 'All reports',
  value: 'ALL',
  key: 0
}, {
  text: 'Missing from Sisu',
  value: 'NOT_REGISTERED',
  key: 1
}, {
  text: 'Partly registered to Sisu',
  value: 'PARTLY_REGISTERED',
  key: 2
}, {
  text: 'Fully registered to Sisu',
  value: 'REGISTERED',
  key: 3
}]

export default ({ reduxKey, action }) => {
  const [mounted, setMounted] = useState(false)
  const filters = useSelector((state) => state.sisReports.filters)
  const dispatch = useDispatch()
  const { offset, limit } = useSelector((state) => state.sisReports[reduxKey])

  const toggle = (name) => dispatch(toggleFilterAction(name))
  const set = (name, value) => dispatch(setFilterAction(name, value))

  useEffect(() => {
    // Prevent fetch when filters are initially rendered
    if (mounted)
      dispatch(action({ offset, limit, filters }))
    setMounted(true)
  }, [filters])

  return <>
    <Header as='h3'>Include reports with:</Header>
    <Form>
      <Form.Group>
        <Form.Field
          control={Radio}
          label='Contains errors'
          checked={filters.errors}
          onChange={() => toggle('errors')}
          toggle />
        <Form.Field
          control={Radio}
          label='Not sent to Sisu'
          checked={filters.notSent}
          onChange={() => toggle('notSent')}
          toggle />
        <Form.Field
          control={Radio}
          label='Missing enrollments'
          checked={filters.noEnrollment}
          onChange={() => toggle('noEnrollment')}
          toggle />
        <Form.Field
          control={Dropdown}
          label='Filter by attainment status'
          value={filters.status || 'ALL'}
          options={STATE_OPTIONS}
          onChange={(_, data) => set('status', data.value)} />
      </Form.Group>
      <Form.Group>
        <Form.Field
          control={Input}
          label='Filter by student number'
          value={filters.search}
          onChange={(event) => set('student', event.target.value)} />
      </Form.Group>
      <Form.Group>
      </Form.Group>
    </Form>
  </>
}
