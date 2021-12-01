import React from 'react'
import { Header, Icon, List, Popup, Segment } from 'semantic-ui-react'

const instructionContainer = {
  padding: '1rem'
}

const detailedInstructions = {
  textAlign: 'left',
  width: "60em"
}

const instruction = {
  padding: '1rem'
}

const code = {
  fontSize: '1.1rem',
  padding: "2px 4px",
  color: '#1f1f1f',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px'
}

const code2 = {
  ...code,
  maxWidth: '30rem',
  fontSize: '0.9rem'
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
        <p style={instruction}>Language of "Äidinkielinen viestintä"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language of "Kypsyysnäyte"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </List.Item>
      <List.Item>
        <p style={instruction}>Language of "Tutkimustiedonhaku"</p>
        "fi", "en", "sv". Use "x" to opt-out for student.
      </List.Item>
    </List>
  </div>
)

export default () => (
  <Segment data-cy="userguide">
    <div style={instructionContainer}>
      <Header as="h2">
        Reporting bachelor thesis completions through Suotar
      </Header>
      <p>
        Suotar automates reporting completions for courses Äidinkielinen viestintä, Tutkimustiedonhaku and Kypsyysnäyte.The language of extra courses is defaulted to the language of bachelor thesis and can be controlled with the last three columns in CSV.
        <br />
        To opt-out reporting, an extra course use value "x".
      </p>
      <p>
        If a bachelor thesis is reported in English the language of extra courses have to be defined explicitly.
      </p>
      <Header as="h3">
        Each completion should be its own line in the following format:
        <span>
          <Popup
            on={['hover', 'click']}
            pinned
            trigger={
              <Icon
                style={{ marginLeft: "0.3em" }}
                name="question circle"
                size="large"
              ></Icon>
            }
            content={DetailedInstructions}
          >
          </Popup>
        </span>
      </Header>
      <code style={code}>
        student number; grade; credits; bsc language; date; lang; lang; lang
      </code>
      <Header as="h3">
        Examples of valid lines:
      </Header>
      <pre style={code2}>
        011000002;3<br />
        010000003;3;;sv<br />
        011110002;4;;;01.11.2021<br />
        011110002;5;;en;;en;fi;en<br />
        011110002;5;;fi;;x;;x<br />
      </pre>
    </div>
  </Segment>
)