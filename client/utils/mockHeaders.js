const ITEM_NAME = 'fakeUser'

export const possibleUsers = [
  {
    uid: 'admin',
    employeeNumber: 123,
    givenName: 'admin',
    mail: 'suotar-admin@helsinki.fi',
    schacDateOfBirth: undefined,
    hypersonuniqueid: undefined,
    sn: 'admin'
  },
  {
    uid: 'grader',
    employeeNumber: 321,
    givenName: 'grader',
    mail: 'suotar-grader@helsinki.fi',
    schacDateOfBirth: 19770501,
    hypersonuniqueid: '0123456789',
    hyGroupCn: '',
    sn: 'grader'
  },
  {
    uid: 'employee',
    employeeNumber: 222
  },
  {
    uid: 'non-employee',
    employeeNumber: undefined
  }
]

export const setHeaders = (uid) => {
  const user = possibleUsers.find((u) => u.uid === uid)
  if (!user) return

  localStorage.setItem(ITEM_NAME, JSON.stringify(user))
}

export const logout = () => {
  localStorage.setItem(
    ITEM_NAME,
    JSON.stringify({
      uid: '',
      employeeNumber: undefined,
      givenName: '',
      mail: '',
      schacDateOfBirth: undefined,
      hypersonuniqueid: undefined,
      sn: undefined
    })
  )
}

export const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem(ITEM_NAME) || '{}')
  return user
}

export const clearHeaders = () => {
  localStorage.removeItem(ITEM_NAME)
}