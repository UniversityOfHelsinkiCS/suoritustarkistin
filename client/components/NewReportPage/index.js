import React from 'react'
import InputSelector from 'Components/NewReportPage/InputSelector'
import SisUserGuide from 'Components/NewReportPage/SisUserGuide'
import Message from 'Components/Message'

import { Message as MessageComponent } from 'semantic-ui-react'


export default () => {

  return (
    <div>
      <SisUserGuide />
      <Message />
      <MessageComponent style={{ maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }} color="blue">
        <MessageComponent.Header>Suotar staff is vacationing 5.7. - 25.7.</MessageComponent.Header>
        <MessageComponent.Content>
          <p>If in any trouble, please contact <a href="mailto:Toska <grp-toska@cs.helsinki.fi>">grp-toska@cs.helsinki.fi</a></p>
        </MessageComponent.Content>
      </MessageComponent>
      <InputSelector />
    </div>
  )
}
