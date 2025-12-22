const express = require("express");
const bodyParser = require("body-parser");
const { handleMessage, handlePostback } = require("./messenger");
const { renderDashboard } = require("./dashboard");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// VERIFY WEBHOOK
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// RECEIVE MESSAGE
app.post("/webhook", (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (event?.message) {
    handleMessage(event.sender.id, event.message);
  }

  if (event?.postback) {
    handlePostback(event.sender.id, event.postback.payload);
  }

  res.sendStatus(200);
});

// DASHBOARD SUPPORT
app.get("/dashboard", renderDashboard);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Bot running on port", PORT);
});
