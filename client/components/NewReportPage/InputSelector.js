import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import Dropzone from 'Components/NewReportPage/Dropzone'
import InputOptions from 'Components/NewReportPage/InputOptions'
import TextInput from 'Components/NewReportPage/TextInput'
import ReportDisplay from 'Components/NewReportPage/ReportDisplay'

export default () => {
  let panes = [
    {
      menuItem: (
        <Menu.Item key="sis-copypaste" data-cy="sis-copypaste">
          <Icon name="file alternate outline" />
          Copy & Paste
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <TextInput />
          <InputOptions />
          <ReportDisplay />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="sis-dragdrop" data-cy="sis-dragdrop">
          <Icon name="folder open" />
          Drag & Drop
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <Dropzone />
          <InputOptions />
          <ReportDisplay />
        </Tab.Pane>
      )
    }
  ]

  return <Tab data-cy="input-form" panes={panes} />
}
