import React, { useState } from 'react'
import { Paper, Tab, Tabs } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
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
      key: 'copypaste',
      label: 'Copy & Paste',
      icon: <DescriptionOutlinedIcon />,
      render: () => (
        <>
          <TextInput parseCSV={parseCSV} />
          <InputOptions parseCSV={parseCSV} />
          <ReportDisplay />
        </>
      )
    },
    {
      key: 'dragdrop',
      label: 'Drag & Drop',
      icon: <FolderOpenIcon />,
      render: () => (
        <>
          <Dropzone parseCSV={parseCSV} />
          <InputOptions parseCSV={parseCSV} />
          <ReportDisplay />
        </>
      )
    }
  ]
  if (hasKandi)
    panes.push({
      key: 'copypaste-kandi',
      label: 'Copy & Paste KANDI',
      icon: <DescriptionOutlinedIcon />,
      render: () => (
        <>
          <TextInput kandi parseCSV={parseKandiCSV} />
          <InputOptions kandi parseCSV={parseKandiCSV} />
          <ReportDisplay kandi allowDelete={false} />
        </>
      )
    })
  if (hasErillisKirjaus)
    panes.push({
      key: 'copypaste-erilliskirjaus',
      label: 'Copy & Paste ERILLISKIRJAUS',
      icon: <DescriptionOutlinedIcon />,
      render: () => (
        <>
          <TextInput extra parseCSV={parseExtraCSV} />
          <InputOptions extra parseCSV={parseExtraCSV} />
          <ReportDisplay allowDelete={false} />
        </>
      )
    })

  const handleTabChange = (_, value) => {
    setActiveIndex(value)
    dispatch(resetNewRawEntriesAction({ graderId }))
    if (value === 2 && hasKandi) setDisplayBscUserGuide(true)
    else setDisplayBscUserGuide(false)
  }

  const activePane = panes[activeIndex] || panes[0]

  return (
    <>
      {!displayBscUserGuide ? <UserGuide /> : <BachelorThesisUserGuide />}
      <Message />
      <Paper variant="outlined" data-cy="input-form" sx={{ mt: 2 }}>
        <Tabs value={activeIndex} onChange={handleTabChange}>
          {panes.map((pane) => (
            <Tab key={pane.key} data-cy={pane.key} icon={pane.icon} iconPosition="start" label={pane.label} />
          ))}
        </Tabs>
        <div style={{ padding: '1em' }}>{activePane.render()}</div>
      </Paper>
    </>
  )
}
