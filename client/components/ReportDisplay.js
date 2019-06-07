import React from 'react'

const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
} = require('../../util/validators')

const LANGUAGES = {
  fi: 1,
  en: 6,
}

// to be replaced with user input
const grader = { name: 'Jami Kousa', identityCode: 'jakousa' }
const course = {
  credits: '3,0',
  name: 'devops',
  courseCode: 'DOPS',
  language: 'en',
}
const date = '1.1.1900'

const isValidRow = (row) => {
  if (!isValidStudentId(row[0])) {
    return false
  }
  if (row[1] && !isValidGrade(row[1])) {
    return false
  }
  if (row[2] && !isValidCreditAmount(row[2])) {
    return false
  }
  if (row[3] && !LANGUAGES[row[3]]) {
    return false
  }
  return true
}

const parseDataToReport = (data) => {
  const splitData = data.trim().split('\n')
  const reportRows = splitData.map((row) => {
    const splitRow = row.split(';')
    if (isValidRow(splitRow)) {
      return (
        <tr key={splitRow[0]}>
          <td>{course.name}</td>
          <td>{splitRow[0]}</td>
          <td>{splitRow[1] || 'Hyv.'}</td>
          <td>{splitRow[2] || course.credits}</td>
          <td>{splitRow[3] || course.language}</td>
          <td>{grader.name}</td>
          <td>{date}</td>
        </tr>
      )
    }
    throw new Error(`Validation error in row "${row}"`)
  })

  return (
    <table>
      <tbody>
        <tr>
          <th>Kurssi</th>
          <th>Opiskelijanumero</th>
          <th>Arvosana</th>
          <th>Laajuus (op)</th>
          <th>Kieli</th>
          <th>Arvostelija</th>
          <th>Arvostelupäivämäärä</th>
        </tr>
        {reportRows}
      </tbody>
    </table>
  )
}

export default ({ reportData }) => (
  <div>{reportData === 'No report given.' ? reportData : parseDataToReport(reportData)}</div>
)
