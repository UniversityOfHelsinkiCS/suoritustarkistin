const nodemailer = require('nodemailer')
const { isEnabled, messageOptions, smtpOptions } = require('../config/email')

const sendEmail = (attachments) => {
  if (!isEnabled) {
    console.log('Email disabled, set EMAIL_ENABLED=true to enable.')
    return
  }

  const transporter = nodemailer.createTransport(smtpOptions)
  const emailOptions = {
    ...messageOptions,
    subject: 'New course completions.',
    text: 'Transfer files as attachments.',
    attachments
  }

  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      throw error
    } else {
      console.log('Email sent:', info.response)
    }
  })
}

module.exports = sendEmail
