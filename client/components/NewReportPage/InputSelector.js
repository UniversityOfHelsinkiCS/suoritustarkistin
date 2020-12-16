import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import Dropzone from 'Components/NewReportPage/Dropzone'
import TextInput from 'Components/NewReportPage/TextInput'

export default () => {
  const user = useSelector((state) => state.user.data)

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
    },
    user.adminMode &&
    {
      menuItem: (
        <Menu.Item key="sis-copypaste" data-cy="sis-copypaste">
          <Icon name="file alternate outline" />
          SIS - Copy & Paste
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <TextInput />
        </Tab.Pane>
      )
    }
  ]
  return <Tab panes={panes} />
}
