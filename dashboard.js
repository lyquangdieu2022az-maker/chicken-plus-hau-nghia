const { getTickets } = require("./ticket");

function renderDashboard(req, res) {
  const tickets = getTickets();
  res.send(`
    <h2>Support Dashboard</h2>
    <pre>${JSON.stringify(tickets, null, 2)}</pre>
  `);
}

module.exports = { renderDashboard };
