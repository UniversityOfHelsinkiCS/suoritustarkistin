import React, { useMemo } from 'react'
import { Loader } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { setNewRawEntriesAction } from 'Utilities/redux/sisNewRawEntriesReducer'
import { useDropzone } from 'react-dropzone'
import { parseCSV } from 'Utilities/sisInputParser'

const baseStyle = {
  flex: 1,
  display: 'flex',
  minHeight: '218px',
  flexDirection: 'column',
  alignItems: 'center',
  verticalAlign: 'center',
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

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)

  const onDrop = (acceptedFiles) => {
    const reader = new FileReader()

    reader.onabort = () => alert('file reading was aborted')
    reader.onerror = () => alert('file reading has failed')
    reader.onload = () => {
      const fileString = reader.result
      const data = parseCSV(fileString)
      dispatch(
        setNewRawEntriesAction({
          ...newRawEntries,
          data,
          rawData: ''
        })
      )
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
    <div className="container" style={{ cursor: 'pointer' }}>
      <div data-cy="sis-dropzone" {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>
          Drag a file here, or find it by clicking this box.
        </p>
        <p>
          One .csv, .txt, or .dat -ended file, under 5MB is accepted
        </p>
        <Loader size='big' inline active={newRawEntries.sending} />
      </div>
    </div>
  )
}
