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
  fontWeight: 700
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
        Student numbers will be fetched from Sisu for reporting. Students not present in Sisu, cannot be given course completions.
      </List.Item>
      <List.Item>
        <p style={instruction}>Grade</p>
        Each course has a pre-defined grade scale in Sisu. For most it is "0-5" or "Hyv.-Hyl.".
        Only grades within the grade scale of the course can be given.
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
        You can add date separately for each student.
        Any date chosen from date-picker will apply to completions that do not have a separately set date for them.
        Please note that the course instance will be picked based automatically based on the completion date.  
      </List.Item>
      <List.Item>
        <p style={instruction}>Course code</p>
        Not used
      </List.Item>
      <List.Item>
        <p style={instruction}>Course code</p>
        Not used
      </List.Item>
      <List.Item>
        <p style={instruction}>Language of "Äidinkielinen viestintä"</p>
        "fi", "en", "sv". Use "x" to opt out for student.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language of "Kypsyysnäyte"</p>
        "fi", "en", "sv". Use "x" to opt out for student.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language of "Tutkimustiedonhaku"</p>
        "fi", "en", "sv". Use "x" to opt out for student.
      </List.Item>
    </List>
  </div>
)

export default () => (
  <Segment data-cy="userguide">
    <div style={instructionContainer}>
      <Header>
        Reporting bachelor thesis completions through Suotar
      </Header>
      <p>
        Suotar automates reporting completions for courses Äidinkielinen viestintä, Tutkimustiedonhaku and Kypsyysnäyte.
        Language of extra courses is defaulted to language of bachelor thesis and can be controlled with last three columns in csv.
        To opt out reporting a extra course use value "x". 
      </p>
      <p>
        If bachelor thesis is reported in english the language of extra courses have to be defined explicitly.
      </p>
      <p style={subHeader}>
        Each completion should be its own line in the following format:
      </p>
      <p style={subHeader}>
        student number;grade;credits;bsc language;date;<strike>course code</strike>;lang;lang;lang
        <span>
          <Popup
            on={['hover', 'click']}
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
        <List.Item>011000002;3</List.Item>
        <List.Item>010000003;3;;sv</List.Item>
        <List.Item>011110002;4;;;01.11.2021</List.Item>
        <List.Item>011110002;5;;en;;en;fi;en</List.Item>
        <List.Item>011110002;5;;fi;;x;;x</List.Item>
      </List>
    </div>
  </Segment>
)