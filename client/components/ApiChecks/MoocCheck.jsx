import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Form, Header, Input } from 'semantic-ui-react'
import { checkMooc } from 'Utilities/redux/apiCheckReducer'
import MoocInstance from './MoocInstance'

export default () => {
  const dispatch = useDispatch()
  const [data, setData] = useState({ course: '' })

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkMooc(data.course))
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Header>Mooc check</Header>
      <Form onSubmit={handleCheck} style={{ marginBottom: '60px' }}>
        <Form.Field
          control={Input}
          label="Enter course code or mooc-slug"
          action={{
            icon: 'search',
            color: 'blue',
            labelPosition: 'right',
            content: 'Check'
          }}
          value={data.course || ''}
          placeholder="TKT10002"
          onChange={(e) => setData({ course: e.target.value })}
        />
      </Form>
      <MoocInstance />
    </div>
  )
}
