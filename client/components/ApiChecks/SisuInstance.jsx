import React from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export default ({ realisation, index, active, setActive }) => {
  const { activityPeriod, enrollments, droppedByCron } = realisation

  const getCardRow = (label, value) => (
    <div>
      <b>{label}: </b>
      {value || 'null'}
    </div>
  )

  const getEnrollments = () => {
    if (!enrollments.length) return <b>Realisation has no enrollments</b>

    return (
      <div>
        {enrollments.map((e, i) => (
          <div key={`${e.person?.studentNumber}+${i}`}>
            {getCardRow('studentNumber', e.person?.studentNumber)}
            {getCardRow('email', e.person?.primaryEmail)}
            {getCardRow('mooc', e.person?.secondaryEmail)}
            ------------------------
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card variant="outlined" sx={{ padding: '20px', mb: 2 }}>
      {getCardRow('startDate', activityPeriod?.startDate)}
      {getCardRow('endDate', activityPeriod?.endDate)}
      {getCardRow('enrollments', enrollments.length)}
      <div style={{ marginTop: '10px' }}>
        <Chip
          size="small"
          color={droppedByCron ? 'error' : 'success'}
          label={droppedByCron ? 'Dropped by cron (activityPeriod)' : 'Used by cron'}
        />
      </div>
      <Accordion
        disableGutters
        elevation={0}
        variant="outlined"
        sx={{ mt: '20px' }}
        expanded={active === index}
        onChange={() => setActive(active === index ? -1 : index)}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
          // MUI paints a grey focus-visible background over the summary once clicked
          sx={{
            backgroundColor: '#2185d0',
            color: 'white',
            '&.Mui-focusVisible': { backgroundColor: '#2185d0' },
            '&:hover': { backgroundColor: '#1a6fb0' }
          }}
        >
          Enrollments
        </AccordionSummary>
        <AccordionDetails>{getEnrollments()}</AccordionDetails>
      </Accordion>
    </Card>
  )
}
