const isEnabled = process.env.EMAIL_ENABLED === 'true'
const messageOptions = {
  from: 'Suoritustarkistin Robot <noreply@helsinki.fi>',
  replyTo: 'matti.luukkainen@helsinki.fi',
  cc: 'matti.luukkainen@helsinki.fi',
  to: process.env.EMAIL_RECEIVER
}
const smtpOptions = {
  host: 'smtp.helsinki.fi',
  port: 587,
  secure: false
}

module.exports = {
  isEnabled,
  messageOptions,
  smtpOptions
}
