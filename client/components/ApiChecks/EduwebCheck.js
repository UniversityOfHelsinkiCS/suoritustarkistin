import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Input, Header, Form, Loader } from 'semantic-ui-react'
import { checkEduWeb } from 'Utilities/redux/apiCheckReducer'
import EduwebInstance from 'Components/ApiChecks/EduwebInstance'


export default () => {
  const dispatch = useDispatch()
  const { eduweb, pending } = useSelector((state) => state.apiChecks)
  const [data, setData] = useState({})
  const [active, setActive] = useState(0)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkEduWeb(data.course))
  } 

  const getInstanceCards = (eduweb) => {
    const instances = eduweb?.instances
    if (!eduweb) return ''
    if (!instances || !instances.length) return <b>No instances found from Eduweb-api with the course code</b>
  
    return (
      <div>
        {eduweb.instances.map((instance) => <EduwebInstance key={instance.oodi_id} instance={instance} active={active} setActive={setActive} />)}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Header>Eduweb check</Header>
      <Loader size='big' active={pending} />
      <Form onSubmit={handleCheck} style={{ marginBottom: '100px' }}>
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
