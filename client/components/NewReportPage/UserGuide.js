import React from 'react'
import { Message, List } from 'semantic-ui-react'

const exampleStyle = {
  textAlign: 'center'
}

export default () => (
  <Message data-cy="userguide" style={exampleStyle}>
    <div>
      Please report completions with the following format:
      <br />
      <br />
      <strong>
        student number;grade;credits;language;date
      </strong>
      <br />
      <br />
      Valid example lines:
      <List>
        <List.Item>010000003;2;5;fi</List.Item>
        <List.Item>011000002;;2,0</List.Item>
        <List.Item>011100009</List.Item>
        <List.Item>011110002;;;fi;25.7.2019</List.Item>
      </List>
      Only the student number is mandatory. Rest of the details, if not given, are filled in from the course defaults. The default for grade is "Hyv." (i.e. passed). 
      To mark a failed course, use "0" or "Hyl." (i.e. failed).
      <br />
      Suotar supports three languages for course completions "fi", "en", "sv".
      <br />
      <br />
      If you cannot find the right grader or course, please contact grp-toska@helsinki.fi to get it added.
    </div>
  </Message>
)
