/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import { Header, Icon, List, Popup, Segment } from 'semantic-ui-react'

const instructionContainer = {
  padding: '1rem'
}

const detailedInstructions = {
  textAlign: 'left',
  width: '60em'
}

const instruction = {
  margin: '0.5em 0em 0.3em 0em',
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
    <Header as="h1">Detailed instructions</Header>
    <List>
      <List.Item>
        <p style={instruction}>Student number</p>
        Student numbers will be fetched from Sisu for reporting. Students not present in Sisu, cannot be given course
        completions.
      </List.Item>
      <List.Item>
        <p style={instruction}>Grade</p>
        Each course has a pre-defined grade scale in Sisu. For most it is "0-5" or "Hyv.-Hyl.". Only grades within the
        grade scale of the course can be given.
      </List.Item>
      <List.Item>
        <p style={instruction}>Credits</p>
        You can define the amount of credits for each student separately or use the course default credit amount.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language</p>
        Suotar supports three languages for course completions "fi", "en", "sv".
      </List.Item>
      <List.Item>
        <p style={instruction}>Date of completion</p>
        You can add date separately for each student. Any date chosen from date-picker will apply to completions that do
        not have a separately set date for them. Please note that the course instance will be picked automatically
        based on the completion date.
      </List.Item>
      <List.Item>
        <p style={instruction}>Course code</p>
        You can select course for the entry by providing the course code in csv or by using the course dropdown below.
        The course dropdown selection is used for all entries that do not have the course code included in csv.
      </List.Item>
    </List>
  </div>
)

export default () => (
  <Segment data-cy="userguide" style={instructionContainer}>
    <Header as="h2">Reporting course completions through Suotar</Header>
    <p>
      Teachers add course completions to Suotar either by copy-pasting or by inserting a csv. When hitting "create
      report"-button, Suotar creates a report of these completions, that will be automatically added to Sisu.
      Teachers can see their own reports from the "View Reports"-page.
    </p>
    <Header as="h3">
      Each completion should be its own line in the following format:{' '}
      <span>
        <Popup
          on={['hover', 'click']}
          pinned
          trigger={<Icon style={{ marginLeft: '0.3em' }} name="question circle" size="large" />}
          content={DetailedInstructions}
        />
      </span>
    </Header>
    <code style={code}>student number;grade;credits;language;date;course code</code>
    <Header as="h3">Examples of valid lines:</Header>
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
    <p>If you cannot find the right grader or course, please contact grp-toska@helsinki.fi to get it added.</p>
  </Segment>
)
