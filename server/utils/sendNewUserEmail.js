const sendEmail = require("./sendEmail")
const { newUserForAdmin } = require("./emailFactory")

const sendNewUserEmail = async (user) =>
  await sendEmail({
    to: 'Toska <grp-toska@helsinki.fi>',
    cc: null,
    replyTo: 'Toska <grp-toska@helsinki.fi>',
    subject: 'New user in Suotar 👀',
    html: newUserForAdmin(user.name, user.email),
    attachments: [
      {
        filename: 'suotar.png',
        path: `${process.cwd()}/client/assets/suotar.png`,
        cid: 'toskasuotarlogoustcid'
      }
    ]
  })

module.exports = sendNewUserEmail
