const nodemailer = require('nodemailer')
const logger = require('@utils/logger')
const { isEnabled, messageOptions, smtpOptions } = require('../config/email')

const sendEmail = async (subject, text, attachments, html) => {
  if (!isEnabled) {
    logger.error('Email disabled, set EMAIL_ENABLED=true to enable.')
    return
  }

  const transporter = nodemailer.createTransport(smtpOptions)
  const emailOptions = {
    ...messageOptions,
    subject,
    attachments
  }
  if (text) emailOptions.text = text
  if (html) emailOptions.html = html

  return transporter.sendMail(emailOptions)
}

module.exports = sendEmail
