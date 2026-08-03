import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Form, Header, Input } from 'semantic-ui-react'
import { checkNewMooc } from 'Utilities/redux/apiCheckReducer'
import NewMoocInstance from './NewMoocInstance'

export default () => {
  const dispatch = useDispatch()
  const [data, setData] = useState({ course: '' })

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkNewMooc(data.course))
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Header>New Mooc check</Header>
      <Form onSubmit={handleCheck} style={{ marginBottom: '60px' }}>
        <Form.Field
          control={Input}
          label="Enter course code, course id or mooc-slug"
          action={{
            icon: 'search',
            color: 'blue',
            labelPosition: 'right',
            content: 'Check'
          }}
          value={data.course || ''}
          placeholder="DATA20041"
          onChange={(e) => setData({ course: e.target.value })}
        />
      </Form>
      <NewMoocInstance />
    </div>
  )
}
