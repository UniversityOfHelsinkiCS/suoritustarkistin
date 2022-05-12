const ITEM_NAME = 'fakeUser'
import { testUsers } from '../../utils/common'

export const possibleUsers = [
  {
    uid: testUsers[0].uid,
    employeeNumber: testUsers[0].employeeId,
    givenName: testUsers[0].name,
    mail: testUsers[0].email,
    schacDateOfBirth: undefined,
    hypersonuniqueid: undefined,
    sn: testUsers[0].uid
  },
  {
    uid: testUsers[1].uid,
    employeeNumber: testUsers[1].employeeId,
    givenName: testUsers[1].name,
    mail: testUsers[1].email,
    schacDateOfBirth: undefined,
    hypersonuniqueid: undefined,
    sn: testUsers[1].uid
  },
  {
    uid: testUsers[2].uid,
    employeeNumber: testUsers[2].employeeId,
    givenName: testUsers[2].name,
    mail: testUsers[2].email,
    schacDateOfBirth: undefined,
    hypersonuniqueid: undefined,
    sn: testUsers[2].uid
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
