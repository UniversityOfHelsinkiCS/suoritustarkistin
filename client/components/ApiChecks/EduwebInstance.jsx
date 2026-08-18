import React from 'react'
import { useSelector } from 'react-redux'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Card from '@mui/material/Card'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export default ({ instance, active, setActive }) => {
  const { eduweb } = useSelector((state) => state.apiChecks)

  const getCardRow = (instance, attribute) => (
    <div>
      <b>{attribute}: </b>
      {instance[attribute]}
    </div>
  )

  const getEnrollments = (url) => {
    const enrollments = eduweb?.enrollments[url]
    if (!enrollments || !enrollments.length) return <b>Instance has no enrollments</b>

    return (
      <div>
        {enrollments.map((s, i) => (
          <div key={`${s.email}+${i}`}>
            {getCardRow(s, 'onro')}
            {getCardRow(s, 'email')}
            {getCardRow(s, 'mooc')}
            ------------------------
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card variant="outlined" sx={{ padding: '20px', mb: 2 }}>
      {getCardRow(instance, 'oodi_id')}
      {getCardRow(instance, 'url')}
      {getCardRow(instance, 'alkupvm')}
      {getCardRow(instance, 'loppupvm')}
      <Accordion
        disableGutters
        elevation={0}
        variant="outlined"
        sx={{ mt: '20px' }}
        expanded={active === instance.url}
        onChange={() => setActive(active === instance.url ? -1 : instance.url)}
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
        <AccordionDetails>{getEnrollments(instance.url)}</AccordionDetails>
      </Accordion>
    </Card>
  )
}
