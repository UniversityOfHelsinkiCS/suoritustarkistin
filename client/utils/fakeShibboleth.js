const ITEM_NAME = 'fakeUser'

export const possibleUsers = [
  {
    employeeNumber: 'admin',
    givenName: 'adminEtunimi',
    mail: 'grp-toska+mockadmin@helsinki.fi',
    schacDateOfBirth: undefined,
    schacPersonalUniqueCode: undefined,
    sn: 'admin'
  },
  {
    employeeNumber: 'staff',
    givenName: 'non-admin-staffEtunimi',
    mail: 'grp-toska+mockstaff@helsinki.fi',
    schacDateOfBirth: undefined,
    schacPersonalUniqueCode: undefined,
    sn: 'staff'
  },
  {
    employeeNumber: 'grader',
    givenName: 'graderEtunimi',
    mail: 'grp-toska+mockgrader@helsinki.fi',
    schacDateOfBirth: undefined,
    schacPersonalUniqueCode: undefined,
    sn: 'grader'
  }
]

export const setHeaders = (employeeNumber) => {
  const user = possibleUsers.find((u) => u.employeeNumber === employeeNumber)
  if (!user) return

  localStorage.setItem(ITEM_NAME, JSON.stringify(user))
}

export const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem(ITEM_NAME) || '{}')
  return user
}

export const clearHeaders = () => {
  localStorage.removeItem(ITEM_NAME)
}
