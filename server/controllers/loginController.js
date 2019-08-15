const login = async (req, res) => {
  if (req.user) {
    res
      .status(200)
      .json(req.user)
      .end()
  } else {
    res
      .status(401)
      .json({ error: 'This service is for employees only.' })
      .end()
  }
}

//const logout = async (req, res) => {}

module.exports = { login }
