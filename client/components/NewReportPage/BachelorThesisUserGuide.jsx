import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import HelpIcon from '@mui/icons-material/Help'

const instructionContainer = {
  padding: '1rem'
}

const detailedInstructions = {
  textAlign: 'left',
  width: '60em'
}

const instruction = {
  margin: '0 0 0.2em 0',
  fontWeight: 700
}

const code = {
  fontSize: '1ren',
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

const DetailedInstructions = () => (
  <div style={detailedInstructions}>
    <Typography variant="h5" component="h1" gutterBottom>
      Detailed instructions
    </Typography>
    <List>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Student number</p>
        Student numbers will be fetched from Sisu for reporting. Students not present in Sisu, cannot be given course
        completions.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Grade</p>
        Each course has a pre-defined grade scale in Sisu. For most it is "0-5" or "Hyv.-Hyl.". Only grades within the
        grade scale of the course can be given.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Credits</p>
        You can define the amount of credits for each student separately or use the course default credit amount.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Language</p>
        Suotar supports three languages for course completions "fi", "en", "sv".
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Date of completion</p>
        You can add date separately for each student. Any date chosen from date-picker will apply to completions that do
        not have a separately set date for them. Please note that the course instance will be picked based automatically
        based on the completion date.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Language of "Äidinkielinen viestintä"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Language of "Kypsyysnäyte"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Language of "Tutkimustiedonhaku"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </ListItem>
    </List>
  </div>
)

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
        title={<DetailedInstructions />}
        slotProps={{
          tooltip: {
            // The default tooltip type is 11px, unreadable for a panel of instructions
            // rather than a one-line hint.
            sx: {
              maxWidth: 'none',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              fontSize: '1rem',
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
