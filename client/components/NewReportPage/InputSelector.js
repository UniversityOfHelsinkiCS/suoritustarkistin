import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import SisDropzone from 'Components/NewReportPage/SisDropzone'
import SisInputOptions from 'Components/NewReportPage/SisInputOptions'
import SisTextInput from 'Components/NewReportPage/SisTextInput'
import SisReportDisplay from 'Components/NewReportPage/SisReportDisplay'

export default () => {
  let panes = [
    {
      menuItem: (
        <Menu.Item key="sis-copypaste" data-cy="sis-copypaste">
          <Icon name="file alternate outline" />
          SIS - Copy & Paste
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <SisTextInput />
          <SisInputOptions />
          <SisReportDisplay />
        </Tab.Pane>
      )
    },
    {
      menuItem: (
        <Menu.Item key="sis-dragdrop" data-cy="sis-dragdrop">
          <Icon name="folder open" />
          SIS - Drag & Drop
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <SisDropzone />
          <SisInputOptions />
          <SisReportDisplay />
        </Tab.Pane>
      )
    }
  ]

  return <Tab data-cy="input-form" panes={panes} />
}
