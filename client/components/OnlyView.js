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
    graderEmployeeId: '9876543',
    token: null,
    data: null,
    date: moment().format('D.M.YYYY')
  })

  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [message, setMessage] = useState(null)
  const [textData, setTextData] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const userData = await userService.getAll()
      const courseData = await courseService.getAll()
      setUsers(userData)
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
        users={users}
        courses={courses}
        setTextData={setTextData}
      />
      <ReportDisplay users={users} courses={courses} report={report} />
    </div>
  )
}
