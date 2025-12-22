const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendMail(ticket) {
  await transporter.sendMail({
    from: "FB Support Bot",
    to: process.env.SUPPORT_EMAIL,
    subject: `New Support Ticket ${ticket.id}`,
    text: JSON.stringify(ticket, null, 2)
  });
}

module.exports = { sendMail };
