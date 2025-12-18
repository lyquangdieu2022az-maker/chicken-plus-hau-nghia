const express = require("express");
const bodyParser = require("body-parser");
const { handleMessage, handlePostback } = require("./messenger");

const app = express();
app.use(bodyParser.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// VERIFY
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// WEBHOOK
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const senderId = event.sender.id;

  if (event.message && !event.message.is_echo) {
    await handleMessage(senderId, event.message);
  }

  if (event.postback) {
    await handlePostback(senderId, event.postback.payload);
  }

  res.sendStatus(200);
});

// HEALTH CHECK
app.get("/", (_, res) => res.send("Messenger VIP Support Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot running on port", PORT));
