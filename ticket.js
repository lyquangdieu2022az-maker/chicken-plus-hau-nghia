const { sendMail } = require("./mailer");

const tickets = [];

async function createTicket(psid, type) {
  const ticket = {
    id: "TICKET-" + Date.now(),
    psid,
    type,
    time: new Date().toISOString()
  };

  tickets.push(ticket);
  await sendMail(ticket);
}

function getTickets() {
  return tickets;
}

module.exports = { createTicket, getTickets };
