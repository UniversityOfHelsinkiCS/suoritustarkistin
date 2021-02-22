import React, { useEffect, useState } from 'react'
import { Segment, Button, Header } from 'semantic-ui-react'

export default () => {
  const [crash, setCrash] = useState(false)

  useEffect(() => {
    if (crash) {
      throw new Error('Suotar is on fire!')
    }
  }, [crash])

  return (
    <Segment textAlign="center">
      { process.env.NODE_ENV !== "development"
        ? <Header size="medium">Frontend built at ${process.env.BUILT_AT || 'unknown'}</Header>
        : null}
      <Button size="huge" basic color="red" content="Chaos Monkey" icon="bomb" onClick={() => setCrash(true)} />
    </Segment>
  )
}
