import { DEV_USERS } from '@shared/common'

const ITEM_NAME = 'fakeUser'

export const possibleUsers = DEV_USERS.map(({ employeeId, uid, name, role }) => ({
  employeeNumber: employeeId,
  givenName: name.split(' ')[0],
  sn: name.split(' ').slice(1).join(' '),
  uid,
  mail: `grp-toska+mock${employeeId}@helsinki.fi`,
  role,
  schacDateOfBirth: undefined,
  schacPersonalUniqueCode: undefined
}))

export const setHeaders = (employeeNumber) => {
  const user = possibleUsers.find((u) => u.employeeNumber === employeeNumber)
  if (!user) return

  localStorage.setItem(ITEM_NAME, JSON.stringify(user))
}

export const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem(ITEM_NAME) || '{}')
  return user
}

export const hasHeaders = () => Boolean(localStorage.getItem(ITEM_NAME))

export const clearHeaders = () => {
  localStorage.removeItem(ITEM_NAME)
}
