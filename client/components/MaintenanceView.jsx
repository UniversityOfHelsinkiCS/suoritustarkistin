import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied'

const styles = {
  staffMessage: { width: '50%', marginLeft: 'auto', marginRight: 'auto' },
  fullPageMessage: { maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' },
  fullPageContainer: { width: '100%', minHeight: '1000px', paddingTop: '3rem', textAlign: 'center' }
}

// Full page notice
const MaintenanceView = () => (
  <Box sx={styles.fullPageContainer}>
    <Alert severity="error" icon={false} sx={styles.fullPageMessage}>
      <AlertTitle>Suotar is under construction</AlertTitle>
      <SentimentDissatisfiedIcon sx={{ margin: '2rem', fontSize: '8rem', color: '#91332b' }} />
      <b>
        <p>Suotar is currently under construction, we will be back when Sisu is our master.</p>
        <p>Hope to see you again in June 202x</p>
      </b>
    </Alert>
  </Box>
)

// Smaller message for admins
export const MaintenanceMessage = () => (
  <Alert severity="error" sx={styles.staffMessage}>
    <AlertTitle>Maintenance mode active</AlertTitle>
    <p>Suotar is currently in maintenance mode and only admins are allowed to use Suotar.</p>
  </Alert>
)

export default MaintenanceView
