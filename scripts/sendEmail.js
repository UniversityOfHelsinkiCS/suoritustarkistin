const nodemailer = require('nodemailer')
const { isEnabled, messageOptions, smtpOptions } = require('../config/email')

const sendEmail = async (subject, text, attachments) => {
  if (!isEnabled) {
    console.log('Email disabled, set EMAIL_ENABLED=true to enable.')
    return
  }

  const transporter = nodemailer.createTransport(smtpOptions)
  const emailOptions = {
    ...messageOptions,
    subject,
    text,
    attachments
  }

  return transporter.sendMail(emailOptions)
}

module.exports = sendEmail
