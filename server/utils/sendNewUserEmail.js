const nodemailer = require('nodemailer')
const logger = require('@utils/logger')
const { isEnabled, messageOptions, smtpOptions } = require('../config/email')

const sendNewUserEmail = async (user) => {

  if (!isEnabled) {
    logger.error('Email disabled, set EMAIL_ENABLED=true to enable.')
    return
  }

  try {
    const transporter = nodemailer.createTransport(smtpOptions)
    const emailOptions = {
      from: messageOptions.from,
      to: "Toska <grp-toska@helsinki.fi>",
      subject: 'New user in Suotar 👀',
      html: `<p>${user.name} (${user.email}) just logged into Suotar for the first time! </p>
            <p>If the user should be granted with Grader-priviledges, <a href="https://study.cs.helsinki.fi/suoritustarkistin/">go and grant them</a></p>
            <img src="cid:toskasuotarlogoustcid"/>`,
      attachments: [
        {
          filename: 'suotar.png',
          path: `${process.cwd()}/client/assets/suotar.png`,
          cid: 'toskasuotarlogoustcid'
        }
      ]
    }
  
    transporter.sendMail(emailOptions)
  } catch (e) {
    logger.error("Failed to send newUserEmail.", e)
  }
 
}

module.exports = sendNewUserEmail
