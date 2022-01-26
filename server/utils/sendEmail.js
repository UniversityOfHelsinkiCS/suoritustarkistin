const nodemailer = require('nodemailer')
const logger = require('@utils/logger')
const { isEnabled, messageOptions, smtpOptions } = require('../config/email')

/*
  Options: {subject, text, html, attachments, replyTo, cc, to}
*/
const sendEmail = async (options) => {
  if (!isEnabled) {
    logger.error('Email disabled, set EMAIL_ENABLED=true to enable.')
    logger.info('Would send')
    logger.info(JSON.stringify(options))
    return
  }

  const transporter = nodemailer.createTransport(smtpOptions)
  const emailOptions = { ...messageOptions, ...options }
  const info = await transporter.sendMail(emailOptions)
  if (info) {
    if (info.accepted.length) info.accepted.forEach((sent) => logger.info(`Email sent to ${sent}`))
    if (info.rejected.length) info.rejected.forEach((notSent) => logger.info(`Address ${notSent} was rejected`))
  }
  return info
}

module.exports = sendEmail
