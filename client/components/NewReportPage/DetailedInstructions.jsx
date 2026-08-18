import { List, ListItem, Typography } from '@mui/material'

const container = {
  textAlign: 'left',
  width: '60em'
}

const title = {
  margin: '0 0 0.2em 0',
  fontWeight: 700
}

export const sharedInstructions = [
  {
    title: 'Student number',
    body: 'Student numbers will be fetched from Sisu for reporting. Students not present in Sisu, cannot be given course completions.'
  },
  {
    title: 'Grade',
    body: 'Each course has a pre-defined grade scale in Sisu. For most it is "0-5" or "Hyv.-Hyl.". Only grades within the grade scale of the course can be given.'
  },
  {
    title: 'Credits',
    body: 'You can define the amount of credits for each student separately or use the course default credit amount.'
  },
  {
    title: 'Language',
    body: 'Suotar supports three languages for course completions "fi", "en", "sv".'
  },
  {
    title: 'Date of completion',
    body: 'You can add date separately for each student. Any date chosen from date-picker will apply to completions that do not have a separately set date for them. Please note that the course instance will be picked automatically based on the completion date.'
  }
]

export default ({ instructions }) => (
  <div style={container}>
    <Typography variant="h5" component="h1" gutterBottom>
      Detailed instructions
    </Typography>
    <List>
      {instructions.map(({ title: heading, body }) => (
        <ListItem key={heading} sx={{ display: 'block', px: 0, py: 0.5 }}>
          <p style={title}>{heading}</p>
          {body}
        </ListItem>
      ))}
    </List>
  </div>
)
