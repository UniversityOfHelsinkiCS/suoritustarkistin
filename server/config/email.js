const isEnabled = process.env.EMAIL_ENABLED === 'true'
const messageOptions = {
  from: 'Suotar Robot <noreply@helsinki.fi>',
  replyTo: process.env.REPLY_TO_EMAIL,
  cc: process.env.CC_RECEIVER,
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
