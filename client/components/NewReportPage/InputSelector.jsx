import React, { useState } from 'react'
import { Icon, Menu, Tab } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'

import UserGuide from '@client/components/NewReportPage/UserGuide'
import BachelorThesisUserGuide from '@client/components/NewReportPage/BachelorThesisUserGuide'
import Message from '@client/components/Message'
import Dropzone from '@client/components/NewReportPage/Dropzone'
import InputOptions from '@client/components/NewReportPage/InputOptions'
import TextInput from '@client/components/NewReportPage/TextInput'
import ReportDisplay from '@client/components/NewReportPage/ReportDisplay'
import { resetNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import { isRegularExtraCourse, isThesisCourse } from '@shared/common'
import { parseCSV, parseKandiCSV, parseExtraCSV } from '@client/utils/inputParser'

export default () => {
  const dispatch = useDispatch()
  const [displayBscUserGuide, setDisplayBscUserGuide] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const courses = useSelector((state) => state.courses.data)
  const graderId = useSelector((state) => state.newRawEntries.graderId)
  const hasKandi = courses.some((course) => isThesisCourse(course))
  const hasErillisKirjaus = courses.some((course) => isRegularExtraCourse(course))

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
          <TextInput parseCSV={parseCSV} />
          <InputOptions parseCSV={parseCSV} />
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
          <Dropzone parseCSV={parseCSV} />
          <InputOptions parseCSV={parseCSV} />
          <ReportDisplay />
        </Tab.Pane>
      )
    }
  ]
  if (hasKandi)
    panes.push({
      menuItem: (
        <Menu.Item key="copypaste-kandi" data-cy="copypaste-kandi">
          <Icon name="file alternate outline" />
          Copy & Paste KANDI
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <TextInput kandi parseCSV={parseKandiCSV} />
          <InputOptions kandi parseCSV={parseKandiCSV} />
          <ReportDisplay kandi allowDelete={false} />
        </Tab.Pane>
      )
    })
  if (hasErillisKirjaus)
    panes.push({
      menuItem: (
        <Menu.Item key="copypaste-erilliskirjaus" data-cy="copypaste-erilliskirjaus">
          <Icon name="file alternate outline" />
          Copy & Paste ERILLISKIRJAUS
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <TextInput extra parseCSV={parseExtraCSV} />
          <InputOptions extra parseCSV={parseExtraCSV} />
          <ReportDisplay allowDelete={false} />
        </Tab.Pane>
      )
    })

  return (
    <>
      {!displayBscUserGuide ? <UserGuide /> : <BachelorThesisUserGuide />}
      <Message />
      <Tab
        data-cy="input-form"
        panes={panes}
        activeIndex={activeIndex}
        onTabChange={(_, { activeIndex }) => {
          setActiveIndex(activeIndex)
          dispatch(resetNewRawEntriesAction(graderId))
          if (activeIndex === 2 && hasKandi) setDisplayBscUserGuide(true)
          else setDisplayBscUserGuide(false)
        }}
      />
    </>
  )
}
