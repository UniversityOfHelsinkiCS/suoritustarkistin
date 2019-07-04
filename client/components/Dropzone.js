import React, { useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseCSV } from '../utils/reportCsvToJson'

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out'
}

const activeStyle = {
  borderColor: '#2196f3'
}

const acceptStyle = {
  borderColor: '#00e676'
}

const rejectStyle = {
  borderColor: '#ff1744'
}

export default ({ report, setReport, setTextData }) => {
  const onDrop = (acceptedFiles) => {
    const reader = new FileReader()

    reader.onabort = () => alert('file reading was aborted')
    reader.onerror = () => alert('file reading has failed')
    reader.onload = () => {
      const fileString = reader.result
      const data = parseCSV(fileString)
      setReport({
        ...report,
        data
      })
      setTextData('')
    }
    acceptedFiles.forEach((file) => reader.readAsBinaryString(file))
  }

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept
  } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 5000000,
    accept: '.csv, .txt, .dat'
  })

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>
          Lisää tiedosto raahaamalla se tähän, tai etsi se klikkaamalla tästä.
          <br />
          <br />
          Yksi .csv, .txt, tai .dat -päätteinen, alle 5MB tiedosto hyväksytään.
        </p>
      </div>
    </div>
  )
}
