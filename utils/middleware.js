const checkToken = (req, res, next) => {
  if (req.headers.authorization === process.env.SUOTAR_TOKEN) {
    next()
  } else {
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

module.exports = { checkToken }
