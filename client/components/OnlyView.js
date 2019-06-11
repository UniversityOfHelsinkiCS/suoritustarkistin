import React, { useState, useEffect } from 'react'

import Dropzone from 'Components/Dropzone'
import ReportDisplay from 'Components/ReportDisplay'
import InputOptions from 'Components/InputOptions'
import graderService from '../services/graders.js'
import courseService from '../services/courses.js'

export default () => {
  const [reportData, setReportData] = useState('')
  const [graders, setGraders] = useState([])
  const [courses, setCourses] = useState([])

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
      <Dropzone setReportData={setReportData} />
      <InputOptions graders={graders} courses={courses} />
      <ReportDisplay reportData={reportData} />
    </div>
  )
}
