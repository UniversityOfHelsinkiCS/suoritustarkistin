import React, { useState, useEffect } from 'react'
import { Message } from 'semantic-ui-react'
import ReportDisplay from 'Components/ReportDisplay'
import InputOptions from 'Components/InputOptions'
import InputSelector from 'Components/InputSelector'
import UserGuide from 'Components/UserGuide'
import userService from '../services/users.js'
import courseService from '../services/courses.js'
const moment = require('moment')

export default () => {
  const [report, setReport] = useState({
    courseId: null,
    graderEmployeeId: null,
    data: null,
    date: moment().format('D.M.YYYY')
  })

  const [graders, setGraders] = useState([])
  const [courses, setCourses] = useState([])
  const [message, setMessage] = useState(null)
  const [textData, setTextData] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const graderData = await userService.getGraders()
      const courseData = await courseService.getAll()
      const currentGrader = await userService.getCurrentUser()
      const prefilledReport = {
        ...report,
        graderEmployeeId: currentGrader.employeeId
      }

      setReport(prefilledReport)
      setGraders(graderData)
      setCourses(courseData)
    }
    fetchData()
  }, [])

  return (
    <div>
      <UserGuide />
      {message ? (
        <Message
          positive
          onDismiss={() => setMessage(null)}
          header={message.header}
          content={message.content}
        />
      ) : null}
      <InputSelector
        setTextData={setTextData}
        textData={textData}
        report={report}
        setReport={setReport}
      />
      <InputOptions
        setMessage={setMessage}
        setReport={setReport}
        report={report}
        graders={graders}
        courses={courses}
        setTextData={setTextData}
      />
      <ReportDisplay graders={graders} courses={courses} report={report} />
    </div>
  )
}
