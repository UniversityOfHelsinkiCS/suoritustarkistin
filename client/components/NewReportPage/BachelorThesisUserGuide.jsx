import HelpIcon from '@mui/icons-material/Help'
import { Paper, Tooltip, Typography } from '@mui/material'
import React from 'react'

import DetailedInstructions, { sharedInstructions } from './DetailedInstructions'

const instructionContainer = {
  padding: '1rem'
}

const instructions = [
  ...sharedInstructions,
  {
    title: 'Language of "Äidinkielinen viestintä"',
    body: '"fi", "en", "sv". Use "x" to opt-out for student.'
  },
  {
    title: 'Language of "Kypsyysnäyte"',
    body: '"fi", "en", "sv". Use "x" to opt-out for student.'
  },
  {
    title: 'Language of "Tutkimustiedonhaku"',
    body: '"fi", "en", "sv". Use "x" to opt-out for student.'
  }
]

const code = {
  fontSize: '1rem',
  padding: '2px 4px',
  color: '#1f1f1f',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px'
}

const code2 = {
  ...code,
  maxWidth: '30rem',
  fontSize: '0.93rem'
}

export default () => (
  <Paper variant="outlined" data-cy="userguide" style={instructionContainer}>
    <Typography variant="h5" component="h2" gutterBottom>
      Reporting bachelor thesis completions through Suotar
    </Typography>
    <p>
      Suotar automates reporting completions for courses Äidinkielinen viestintä, Tutkimustiedonhaku and
      Kypsyysnäyte.The language of extra courses is defaulted to the language of bachelor thesis and can be controlled
      with the last three columns in CSV.
      <br />
      To opt-out reporting, an extra course use value "x".
    </p>
    <p>If a bachelor thesis is reported in English the language of extra courses have to be defined explicitly.</p>
    <Typography variant="h6" component="h3" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
      Each completion should be its own line in the following format:
      <Tooltip
        title={<DetailedInstructions instructions={instructions} />}
        slotProps={{
          tooltip: {
            sx: {
              maxWidth: 'none',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              p: 2
            }
          }
        }}
      >
        <HelpIcon sx={{ ml: '0.3em' }} />
      </Tooltip>
    </Typography>
    <code style={code}>student number; grade; credits; bsc language; date; lang; lang; lang</code>
    <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
      Examples of valid lines:
    </Typography>
    <pre style={code2}>
      011000002;3
      <br />
      010000003;3;;sv
      <br />
      011110002;4;;;01.11.2021
      <br />
      011110002;5;;en;;en;fi;en
      <br />
      011110002;5;;fi;;x;;x
      <br />
    </pre>
  </Paper>
)
