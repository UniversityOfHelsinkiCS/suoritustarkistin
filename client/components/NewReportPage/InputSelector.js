import React from 'react'
import { Tab, Menu, Icon } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import Dropzone from 'Components/NewReportPage/Dropzone'
import InputOptions from 'Components/NewReportPage/InputOptions'
import SisInputOptions from 'Components/NewReportPage/SisInputOptions'
import TextInput from 'Components/NewReportPage/TextInput'
import SisTextInput from 'Components/NewReportPage/SisTextInput'
import ReportDisplay from 'Components/NewReportPage/ReportDisplay'
import SisReportDisplay from 'Components/NewReportPage/SisReportDisplay'

export default () => {
  const user = useSelector((state) => state.user.data)

  let panes = [
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
          <InputOptions />
          <ReportDisplay />
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
          <InputOptions />
          <ReportDisplay />
        </Tab.Pane>
      )
    },
  ]
  if (user.adminMode) {
    panes = [...panes, {
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
    }]
  }

  return <Tab panes={panes} />
}
