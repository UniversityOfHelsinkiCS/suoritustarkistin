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

const logout = async (req, res) => {
  try {
    const logoutUrl = req.headers.shib_logout_url
    const { returnUrl } = req.body
    if (logoutUrl) {
      return res
        .status(200)
        .send({ logoutUrl: `${logoutUrl}?return=${returnUrl}` })
        .end()
    }
    res
      .status(200)
      .send({ logoutUrl: returnUrl })
      .end()
  } catch (err) {
    res.status(500).json({ message: 'Error with logout', err })
  }
}

module.exports = { login, logout }
