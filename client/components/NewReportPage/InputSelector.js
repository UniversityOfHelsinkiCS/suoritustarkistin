import React, { useState } from 'react'
import { Icon, Menu, Tab, Message as UIMessage } from 'semantic-ui-react'
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
import { isRegularExtraCourse, isThesisCourse } from 'Root/utils/common'
import { parseCSV, parseKandiCSV, parseExtraCSV } from 'Utilities/inputParser'


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
        <TextInput kandi parseCSV={parseKandiCSV} />
        <InputOptions kandi parseCSV={parseKandiCSV} />
        <ReportDisplay kandi allowDelete={false} />
      </Tab.Pane>
    )
  })
  if (hasErillisKirjaus) panes.push({
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

  return <>
    <UIMessage
      icon="bullhorn"
      header="New in Suotar"
      content={<>
        <p>New version of Suotar is released! Now new <b>completions will be reported immediately to Sisu</b> after the grades are saved into Suotar. No extra confirmation from study coordinator is required.</p>
        <p>When reporting completions user might also import enrolled students from different course instances after selecting a course.</p>
      </>}
      style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}
      info />

    {!displayBscUserGuide ? <UserGuide /> : <BachelorThesisUserGuide />}
    <Message />
    <Tab data-cy="input-form"
      panes={panes}
      activeIndex={activeIndex}
      onTabChange={(_, { activeIndex }) => {
        setActiveIndex(activeIndex)
        dispatch(resetNewRawEntriesAction(graderId))
        if (activeIndex === 2 && hasKandi) setDisplayBscUserGuide(true)
        else setDisplayBscUserGuide(false)
      }} />
  </>
}
