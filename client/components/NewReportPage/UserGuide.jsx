import React from 'react'
import { List, ListItem, Paper, Tooltip, Typography } from '@mui/material'
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
        not have a separately set date for them. Please note that the course instance will be picked automatically based
        on the completion date.
      </ListItem>
      <ListItem sx={{ display: 'block', px: 0, py: 0.5 }}>
        <p style={instruction}>Course code</p>
        You can select course for the entry by providing the course code in csv or by using the course dropdown below.
        The course dropdown selection is used for all entries that do not have the course code included in csv.
      </ListItem>
    </List>
  </div>
)

export default () => (
  <Paper variant="outlined" data-cy="userguide" style={instructionContainer}>
    <Typography variant="h5" component="h2" gutterBottom>
      Reporting course completions through Suotar
    </Typography>
    <p>
      Teachers add course completions to Suotar either by copy-pasting or by inserting a csv. When hitting "create
      report"-button, Suotar creates a report of these completions, that will be automatically added to Sisu. Teachers
      can see their own reports from the "View Reports"-page.
    </p>
    <Typography variant="h6" component="h3" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
      Each completion should be its own line in the following format:{' '}
      <Tooltip
        title={<DetailedInstructions />}
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
    <code style={code}>student number;grade;credits;language;date;course code</code>
    <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
      Examples of valid lines:
    </Typography>
    <pre style={code2}>
      010000003;2;5;fi
      <br />
      011000002;;2,0
      <br />
      011100009
      <br />
      011110002;;;fi;25.7.2019
      <br />
      011110002;;;fi;25.7.2019;TKT10001
      <br />
    </pre>
    <p>
      <b>
        If Suotar says that some student is lacking registration for the course, Suotar will "remember" this completion
        and add it automatically to the student, once they have registered to the course.
      </b>
    </p>
    <p>
      If you cannot find the right grader or course, please contact{' '}
      <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a> to get it added.
    </p>
  </Paper>
)
