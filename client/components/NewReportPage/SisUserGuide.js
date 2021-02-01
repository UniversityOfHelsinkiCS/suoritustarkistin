import React from 'react'
import { Header, Icon, List, Popup, Segment } from 'semantic-ui-react'

const instructionContainer = {
  textAlign: 'center',
  width: "70em",
  margin: "auto",
  marginBottom: "1em"
}

const detailedInstructions = {
  textAlign: 'left',
  width:"60em"
}

const instruction = {
  margin: "0.5em 0em 0.3em 0em",
  fontWeight: 700,
}

const subHeader = {
  fontWeight: "700",
  margin: "1em",
  fontSize: "1.1em"
}


const DetailedInstructions = () => (
  <div style={detailedInstructions}>
    <Header>Detailed instructions</Header>
    <List>
      <List.Item>
        <p style={instruction}>Student number</p>
        Student numbers will be fetched from SIS for reporting. Students not present in SIS, cannot be given course completions. 
      </List.Item>
      <List.Item>
        <p style={instruction}>Grade</p>
        Each course has a pre-defined grade scale in SIS. For most it is "0-5" or "Hyv.-Hyl.".
        Only grades within the grade scale of the course can be given.
      </List.Item>
      <List.Item>
        <p style={instruction}>Credits</p>
        You can define the amount of credits for each student separately or use the course default grade amount.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language</p>
        Suotar supports three languages for course completions "fi", "en", "sv".
      </List.Item>
      <List.Item>
        <p style={instruction}>Date of completion</p>
        You can add date separately for each student.
        Any date chosen from date-picker will apply to completions that do not have a separately set date for them.
        Please note that the course instance will be picked based automatically based on the completion date.  
      </List.Item>
    </List>
  </div>
)
// Add this when Sis
export default () => (
  <Segment data-cy="userguide">
    <div style={instructionContainer}>
      <Header>
        Reporting course completions through Suotar
      </Header>
      <p>
        Teachers add course completions to Suotar either by copy-pasting or by inserting a csv.
        When hitting "create report"-button, Suotar creates a report of these completions, that can be later on added to SIS by an education coordinator.
        Teachers can see their own reports from the "View Reports"-page, but only education coordinators can send them to SIS.
      </p>
      <p style={subHeader}>
        Each completion should be its own line in the following format:
      </p>
      <p style={subHeader}>
        student number;grade;credits;language;date 
      <span>
        <Popup
          on={'hover', 'click'}
          pinned
          trigger={
            <Icon
              style={{ marginLeft: "0.3em"}}
              name="question circle"
              size="large"
            ></Icon>
          }
          content={DetailedInstructions}
        >
        </Popup>
      </span>
      </p>
      Valid example lines:
      <List>
        <List.Item>010000003;2;5;fi</List.Item>
        <List.Item>011000002;;2,0</List.Item>
        <List.Item>011100009</List.Item>
        <List.Item>011110002;;;fi;25.7.2019</List.Item>
      </List>
      Only student number and grade are mandatory, rest of the details will be filled with defaults, if nothing is picked.
      <p>
        If you cannot find the right grader or course, please contact grp-toska@helsinki.fi to get it added.
      </p>
    </div>
  </Segment>
)