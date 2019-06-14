import React, { useState, useEffect } from 'react'

import Dropzone from 'Components/Dropzone'
import ReportDisplay from 'Components/ReportDisplay'
import InputOptions from 'Components/InputOptions'
import MessageField from 'Components/MessageField'
import graderService from '../services/graders.js'
import courseService from '../services/courses.js'

export default () => {
  const now = new Date()
  const today = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`

  const [report, setReport] = useState({
    courseId: null,
    graderId: null,
    token: null,
    data: null,
    date: today,
  })
  const [graders, setGraders] = useState([])
  const [courses, setCourses] = useState([])
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const graderData = await graderService.getAll()
      const courseData = await courseService.getAll()
      setGraders(graderData)
      setCourses(courseData)
    }
    fetchData()
  }, [])

  return (
    <div>
      <Dropzone report={report} setReport={setReport} />
      <InputOptions
        messages={messages}
        setMessages={setMessages}
        setReport={setReport}
        report={report}
        graders={graders}
        courses={courses}
      />
      <MessageField messages={messages} />
      <ReportDisplay report={report} />
    </div>
  )
}
