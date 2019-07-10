import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import Dropzone from 'Components/Dropzone'
import TextInput from 'Components/TextInput'

export default ({ report, setReport, setTextData, textData }) => {
  const panes = [
    {
      menuItem: (
        <Menu.Item key="copypaste" data-cy="copypaste">
          <Icon name="edit outline" />
          Copy & Paste
        </Menu.Item>
      ),
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
      menuItem: (
        <Menu.Item key="dragdrop" data-cy="dragdrop">
          <Icon name="folder open outline" />
          Drag & Drop
        </Menu.Item>
      ),
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
