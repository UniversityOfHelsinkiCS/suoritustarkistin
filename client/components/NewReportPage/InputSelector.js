import React, { useState } from 'react'
import { Icon, Menu, Tab } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'

import UserGuide from 'Components/NewReportPage/UserGuide'
import BachelorThesisUserGuide from 'Components/NewReportPage/BachelorThesisUserGuide'
import Message from 'Components/Message'
import Dropzone from 'Components/NewReportPage/Dropzone'
import InputOptions from 'Components/NewReportPage/InputOptions'
import TextInput from 'Components/NewReportPage/TextInput'
import ReportDisplay from 'Components/NewReportPage/ReportDisplay'
import { resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'

export default () => {
  const dispatch = useDispatch()
  const [displayBscUserGuide, setDisplayBscUserGuide] = useState(false)
  const courses = useSelector((state) => state.courses.data)
  const hasKandi = courses.some(({ courseCode }) => courseCode === 'TKT20013')
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
    }]
  if (hasKandi) panes.push({
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
  })

  return <>
    {!displayBscUserGuide ? <UserGuide /> : <BachelorThesisUserGuide />}
    <Message />
    <Tab data-cy="input-form"
      panes={panes}
      onTabChange={(_, { activeIndex }) => {
        dispatch(resetNewRawEntriesAction())
        if (activeIndex === 2) setDisplayBscUserGuide(true)
        else setDisplayBscUserGuide(false)
      }} />
  </>
}
