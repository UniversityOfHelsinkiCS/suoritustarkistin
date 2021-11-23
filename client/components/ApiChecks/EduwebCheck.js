import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Input, Header, Form } from 'semantic-ui-react'
import { checkEduWeb } from 'Utilities/redux/apiCheckReducer'
import Instance from './Instance'


export default () => {
  const dispatch = useDispatch()
  const { eduweb } = useSelector((state) => state.apiChecks)
  const [data, setData] = useState({})
  const [active, setActive] = useState(0)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkEduWeb(data.course))
  } 

  const getInstanceCards = (eduweb) => {
    const instances = eduweb?.instances
    if (!eduweb) return ''
    if (!instances || !instances.length) return 'No instances found from Eduweb-api with the course code'
  
    return (
      <div style={{ marginTop: '50px' }}>
        {eduweb.instances.map((instance) => <Instance instance={instance} active={active} setActive={setActive} />)}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Header>Eduweb check</Header>
      <Form onSubmit={handleCheck} style={{ marginBottom: '60px', maxWidth: '1000px' }}>
        <Form.Field
          control={Input}
          label='Enter course code'
          action={{
            icon: 'search',
            color: 'blue',
            labelPosition: 'right',
            content: 'Check'
          }} 
          value={data.course}
          placeholder="TKT10002"
          onChange={(e, d) => setData({ course: e.target.value })}
        />
      </Form >
      {getInstanceCards(eduweb)}
    </div>
  )
}
