const parseCSV = (string) => {
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const splitRow = row.split(';')
    return {
      studentId: splitRow[0],
      grade: splitRow[1],
      credits: splitRow[2],
      language: splitRow[3]
    }
  })
  return data
}

module.exports = { parseCSV }
