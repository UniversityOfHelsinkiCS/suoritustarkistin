import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import Dropzone from 'Components/NewReportPage/Dropzone'
import InputOptions from 'Components/NewReportPage/InputOptions'
import SisTextInput from 'Components/NewReportPage/SisTextInput'
import SisReportDisplay from 'Components/NewReportPage/SisReportDisplay'

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
          <SisTextInput />
          <InputOptions />
          <SisReportDisplay />
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
          <SisReportDisplay />
        </Tab.Pane>
      )
    }
  ]

  return <Tab data-cy="input-form" panes={panes} />
}
