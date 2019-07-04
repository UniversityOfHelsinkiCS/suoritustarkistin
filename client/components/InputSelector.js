import React, { useState } from 'react'
import { Tab } from 'semantic-ui-react'
import Dropzone from 'Components/Dropzone'
import TextInput from 'Components/TextInput'

export default ({ report, setReport, setTextData, textData }) => {
  const panes = [
    {
      menuItem: 'Copy & Paste',
      render: () => (
        <Tab.Pane>
          <TextInput
            report={report}
            setReport={setReport}
            setTextData={setTextData}
            textData={textData}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: 'Drag & Drop',
      render: () => (
        <Tab.Pane>
          <Dropzone
            report={report}
            setReport={setReport}
            setTextData={setTextData}
          />
        </Tab.Pane>
      )
    }
  ]
  return <Tab panes={panes} />
}
