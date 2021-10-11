import React from 'react'
import { Icon, Menu, Tab } from 'semantic-ui-react'
import { useDispatch } from 'react-redux'

import Dropzone from 'Components/NewReportPage/Dropzone'
import InputOptions from 'Components/NewReportPage/InputOptions'
import TextInput from 'Components/NewReportPage/TextInput'
import ReportDisplay from 'Components/NewReportPage/ReportDisplay'
import { resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'

export default () => {
  const dispatch = useDispatch()
  const panes = [
    {
      menuItem: (
        <Menu.Item key="copypaste" data-cy="copypaste">
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
        <Menu.Item key="dragdrop" data-cy="dragdrop">
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
    },
    {
      menuItem: (
        <Menu.Item key="copypaste-kandi" data-cy="copypaste-kandi">
          <Icon name="file alternate outline" />
          Copy & Paste KANDI
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <TextInput kandi />
          <InputOptions kandi />
          <ReportDisplay allowDelete={false} />
        </Tab.Pane>
      )
    }
  ]

  return <Tab data-cy="input-form" panes={panes} onTabChange={() => dispatch(resetNewRawEntriesAction())} />
}
