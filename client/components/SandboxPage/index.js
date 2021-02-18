import React, {useEffect, useState} from 'react'
import { Segment, Button } from 'semantic-ui-react'

export default () => {
  const [crash, setCrash] = useState(false)

  useEffect(() => {
    if (crash) {
      throw new Error('Suotar is on fire!')
    }
  }, [crash])

  return (
    <Segment textAlign="center">
      <Button size="huge" basic color="red" content="Chaos Monkey" icon="bomb" onClick={() => setCrash(true)} />
    </Segment>
  )
}
