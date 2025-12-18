const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const Redis = require("ioredis");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());

// ===== ENV =====
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ===== REDIS =====
const redis = new Redis(REDIS_URL);

// ===== MAIL =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// ===== VERIFY =====
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === VERIFY_TOKEN
  ) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const senderId = event.sender.id;
  if (event.message?.is_echo) return res.sendStatus(200);

  const state = await redis.get(`state:${senderId}`);
  const lang = await redis.get(`lang:${senderId}`);

  if (!lang) {
    return sendLanguage(senderId);
  }

  if (state === "HUMAN") {
    if (event.postback?.payload === "END_CHAT") {
      await endSupport(senderId);
    }
    return res.sendStatus(200);
  }

  if (event.postback) {
    await handlePayload(senderId, event.postback.payload, lang);
  }

  res.sendStatus(200);
});

// ===== LANGUAGE =====
function sendLanguage(id) {
  sendButtons(id, "Vui lòng chọn ngôn ngữ / Choose language", [
    { title: "🇻🇳 Tiếng Việt", payload: "LANG_VI" },
    { title: "🇺🇸 English", payload: "LANG_EN" }
  ]);
}

// ===== HANDLE PAYLOAD =====
async function handlePayload(id, payload, lang) {
  if (payload === "LANG_VI") {
    await redis.set(`lang:${id}`, "vi");
    return sendMenu(id, "vi");
  }
  if (payload === "LANG_EN") {
    await redis.set(`lang:${id}`, "en");
    return sendMenu(id, "en");
  }

  if (payload === "MENU") return sendMenu(id, lang);

  if (payload === "CONTACT_SUPPORT") {
    await redis.set(`state:${id}`, "HUMAN", "EX", 900);
    await redis.set(`log:${id}`, Date.now());
    sendText(id, lang === "vi"
      ? "👤 Đang kết nối hỗ trợ viên..."
      : "👤 Connecting to support agent...");
    return sendEndButton(id, lang);
  }

  if (payload === "END_CHAT") {
    return endSupport(id);
  }

  sendText(id, "📎 Hướng dẫn: https://m.facebook.com/help");
}

// ===== MENU =====
function sendMenu(id, lang) {
  sendButtons(
    id,
    lang === "vi" ? "Trung tâm hỗ trợ" : "Support Center",
    [
      { title: "📄 Điều khoản", payload: "TERMS" },
      { title: "⚠️ Vi phạm", payload: "VIOLATIONS" },
      { title: "🔓 Mở khoá", payload: "UNLOCK" }
    ]
  );

  setTimeout(() => {
    sendButtons(id,
      lang === "vi" ? "Cần thêm hỗ trợ?" : "Need more help?",
      [{ title: "🆘 Liên hệ tổng đài", payload: "CONTACT_SUPPORT" }]
    );
  }, 400);
}

// ===== SUPPORT =====
async function endSupport(id) {
  const start = await redis.get(`log:${id}`);
  const duration = start ? Math.floor((Date.now() - start) / 1000) : 0;

  await redis.del(`state:${id}`);
  await redis.del(`log:${id}`);

  await transporter.sendMail({
    from: ADMIN_EMAIL,
    to: ADMIN_EMAIL,
    subject: "CSKH kết thúc",
    text: `User ${id} - Thời gian: ${duration}s`
  });

  sendText(id, "✅ Cuộc trò chuyện đã kết thúc.");
  sendMenu(id, await redis.get(`lang:${id}`));
}

// ===== UI HELPERS =====
function sendButtons(id, text, buttons) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text,
            buttons: buttons.map(b => ({
              type: "postback",
              title: b.title,
              payload: b.payload
            }))
          }
        }
      }
    }
  );
}

function sendEndButton(id, lang) {
  sendButtons(
    id,
    lang === "vi" ? "Kết thúc hỗ trợ?" : "End support?",
    [{ title: lang === "vi" ? "Kết thúc" : "End", payload: "END_CHAT" }]
  );
}

function sendText(id, text) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id },
      message: { text }
    }
  );
}

app.get("/", (req, res) => res.send("CSKH BOT RUNNING"));
app.listen(process.env.PORT || 3000);
