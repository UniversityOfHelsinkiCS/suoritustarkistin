const fakeShibbo = (req, res, next) => {
  req.headers.employeenumber = '9876543'
  req.headers.mail = 'pekka.m.testaaja@helsinki.fi'
  req.headers.schacpersonaluniquecode =
    'urn:schac:personalUniqueCode:int:studentID:helsinki.fi:011110002'
  req.headers.uid = 'pemtest'
  req.headers.givenname = 'Pekka'
  req.headers.sn = 'Testaaja'
  next()
}

module.exports = {
  fakeShibbo
}
