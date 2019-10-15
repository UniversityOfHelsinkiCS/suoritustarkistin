import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import Dropzone from 'Components/NewReportPage/Dropzone'
import TextInput from 'Components/NewReportPage/TextInput'

export default () => {
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
          <TextInput />
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
          <Dropzone />
        </Tab.Pane>
      )
    }
  ]
  return <Tab panes={panes} />
}
