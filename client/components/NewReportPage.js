import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Message } from 'semantic-ui-react'
import ReportDisplay from 'Components/ReportDisplay'
import InputOptions from 'Components/InputOptions'
import InputSelector from 'Components/InputSelector'
import UserGuide from 'Components/UserGuide'
import {
  getAllGradersAction,
  getUsersGradersAction
} from 'Utilities/redux/gradersReducer'
import {
  getAllCoursesAction,
  getUsersCoursesAction
} from 'Utilities/redux/coursesReducer'
const moment = require('moment')

export default () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)
  const [report, setReport] = useState({
    courseId: null,
    graderEmployeeId: user.employeeId,
    data: null,
    date: moment().format('D.M.YYYY')
  })
  const [message, setMessage] = useState(null)
  const [textData, setTextData] = useState('')

  useEffect(() => {
    if (user.isAdmin) {
      dispatch(getAllCoursesAction())
      dispatch(getAllGradersAction())
    } else {
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersGradersAction(user.id))
    }
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
