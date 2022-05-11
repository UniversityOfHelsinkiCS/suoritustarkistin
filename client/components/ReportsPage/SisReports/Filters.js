import React, { useEffect, useState } from 'react'
import { Form, Header, Input, Radio, Dropdown, Select } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'

import { toggleFilterAction, setFilterAction } from 'Utilities/redux/sisReportsReducer'
import { formatCoursesForSelection } from '../../NewReportPage/InputOptions'

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
  const courses = useSelector((state) => state.courses.data)
  const courseOptions = formatCoursesForSelection(courses)
  const dispatch = useDispatch()
  const { offset, limit } = useSelector((state) => state.sisReports[reduxKey])

  const toggle = (name) => dispatch(toggleFilterAction(name))
  const set = (name, value) => dispatch(setFilterAction(name, value))
  const debouncedSet = debounce(set, 250)

  useEffect(() => {
    // Prevent fetch when filters are initially rendered
    if (mounted)
      dispatch(action({ offset, limit, filters }))
    setMounted(true)
  }, [filters])

  return <>
    <Header as='h3'>Include reports with:</Header>
    <Form>
      <Form.Group style={{ alignItems: 'center' }}>
        <Form.Field
          control={Radio}
          label='Contains errors'
          checked={filters.errors}
          onChange={() => toggle('errors')}
          toggle />
        <Form.Field
          control={Radio}
          label='Missing enrollments'
          checked={filters.noEnrollment}
          onChange={() => toggle('noEnrollment')}
          toggle />
        <Form.Field
          control={Dropdown}
          label='Attainment status'
          value={filters.status || 'ALL'}
          options={STATE_OPTIONS}
          onChange={(_, data) => set('status', data.value)} />
      </Form.Group>
      <Form.Group>
        <Form.Field
          control={Input}
          label='Filter by student number'
          value={filters.search}
          onChange={(event) => debouncedSet('student', event.target.value)} />
        <Form.Field
          control={Select}
          search
          label='Filter by course'
          value={filters.course}
          options={courseOptions}
          onChange={((_, { value: courseId }) => set('course', courseId))} />
      </Form.Group>
      <Form.Group>
      </Form.Group>
    </Form>
  </>
}
