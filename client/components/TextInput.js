import React from 'react'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from '../utils/reportCsvToJson'

export default ({ report, setReport, textData, setTextData }) => {
  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '') {
      setReport({
        ...report,
        data: null
      })
    } else {
      const data = parseCSV(rawData.trim())
      setReport({
        ...report,
        data
      })
    }
    setTextData(rawData)
  }
  const textAreaStyle = {
    padding: '20px'
  }

  return (
    <Form>
      <TextArea
        data-cy="pastefield"
        onChange={handleDataChange}
        placeholder="Liitä suoritustiedot tähän ylläolevan ohjeen mukaan formatoituna."
        rows={10}
        value={textData}
        style={textAreaStyle}
      />
    </Form>
  )
}
