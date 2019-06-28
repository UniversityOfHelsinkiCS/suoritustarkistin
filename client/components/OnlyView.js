import React, { useState, useEffect } from 'react'

import { Message } from 'semantic-ui-react'
import ReportDisplay from 'Components/ReportDisplay'
import InputOptions from 'Components/InputOptions'
import InputSelector from 'Components/InputSelector'
import UserGuide from 'Components/UserGuide'
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
    date: today
  })
  const [graders, setGraders] = useState([])
  const [courses, setCourses] = useState([])
  const [message, setMessage] = useState(null)

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
      <UserGuide />
      <InputSelector report={report} setReport={setReport} />
      <InputOptions
        setMessage={setMessage}
        setReport={setReport}
        report={report}
        graders={graders}
        courses={courses}
      />
      {message ? (
        <Message
          positive
          onDismiss={() => setMessage(null)}
          header={message.header}
          content={message.content}
        />
      ) : null}
      <ReportDisplay graders={graders} courses={courses} report={report} />
    </div>
  )
}
