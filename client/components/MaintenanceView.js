import React from 'react'
import { Icon, Message, Segment } from 'semantic-ui-react'


const styles = {
  staffMessage: { width: '50%', marginLeft: 'auto', marginRight: 'auto' },
  fullPageMessage: { maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' },
  fullPageContainer: { width: '100%', minHeight: '1000px', paddingTop: '3rem' }
}

// Full page notice
const MaintenanceView = () => <Segment textAlign="center" style={styles.fullPageContainer}>
  <Message style={styles.fullPageMessage} size="large" error>
    <Message.Header>Suotar is under construction</Message.Header>
    <Message.Content>
      <Icon name="meh outline" color="#91332b" size="massive" style={{ margin: '2rem' }} />
      <b><p>Suotar is currently under construction, we will be back when Sisu is our master.</p>
        <p>Hope to see you again in June 202x</p></b>
    </Message.Content>
  </Message>
</Segment>


// Smaller message for admins
export const MaintenanceMessage = () =>
  <Message size="large" style={styles.staffMessage} error>
    <Message.Header>Maintenance mode active</Message.Header>
    <Message.Content>
      <p>Suotar is currently in maintenance mode and only admins are allowed to use Suotar.</p>
    </Message.Content>
  </Message>

export default MaintenanceView
