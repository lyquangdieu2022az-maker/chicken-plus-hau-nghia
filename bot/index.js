const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const Redis = require("ioredis");

const app = express();
app.use(bodyParser.json());

// ===== ENV =====
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const REDIS_URL = process.env.REDIS_URL;

// ===== REDIS =====
const redis = new Redis(REDIS_URL);

// ===== VERIFY WEBHOOK =====
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const senderId = event.sender?.id;
  if (!senderId) return res.sendStatus(200);

  if (event.message?.is_echo) return res.sendStatus(200);

  const state = (await redis.get(`chat:${senderId}`)) || "BOT";

  // ===== ĐANG NỐI HỖ TRỢ =====
  if (state === "HUMAN") {
    if (event.postback?.payload === "END_CHAT") {
      await endSupport(senderId);
    }
    return res.sendStatus(200);
  }

  // ===== POSTBACK =====
  if (event.postback) {
    await handlePayload(event.postback.payload, senderId);
    return res.sendStatus(200);
  }

  // ===== TEXT =====
  if (event.message?.text) {
    sendMainMenu(senderId);
  }

  res.sendStatus(200);
});

// ===== HANDLE PAYLOAD =====
async function handlePayload(payload, senderId) {
  switch (payload) {
    case "GET_STARTED":
    case "MENU_MAIN":
      sendMainMenu(senderId);
      break;

    case "TERMS":
      sendText(senderId,
        "📄 Điều khoản Facebook:\nhttps://www.facebook.com/policies");
      break;

    case "VIOLATIONS":
      sendText(senderId,
        "⚠️ Tiêu chuẩn cộng đồng:\nhttps://transparency.meta.com/vi-vn/policies/community-standards/");
      break;

    case "UNLOCK_MENU":
      sendUnlockMenu(senderId);
      break;

    case "UNLOCK_DEVICE":
      sendText(senderId,
        "🔓 Tài khoản bị khóa do thiết bị lạ:\nhttps://m.facebook.com/help/669497174142663?locale=vi_VN");
      break;

    case "UNLOCK_DISABLED":
      sendText(senderId,
        "🚫 Tài khoản bị đình chỉ:\nhttps://m.facebook.com/help/103873106370583/list?locale=vi_VN");
      break;

    case "HACKED_MENU":
      sendButtons(
        senderId,
        "🔐 Tài khoản bị chiếm quyền.\nThiết bị này có phải thiết bị chính chủ thường xuyên đăng nhập không?",
        [
          { title: "Có", payload: "HACKED_YES" },
          { title: "Không", payload: "HACKED_NO" }
        ]
      );
      break;

    case "HACKED_YES":
      sendText(senderId,
        "✅ Vui lòng chuẩn bị:\n• SĐT\n• Email liên kết Facebook\n• CCCD chính chủ\n\n👉 Thực hiện tại:\nhttps://m.facebook.com/hacked");
      break;

    case "HACKED_NO":
      sendText(senderId,
        "❌ Rất tiếc, chúng tôi không thể hỗ trợ nếu không phải thiết bị chính chủ.");
      break;

    case "CONTACT_SUPPORT":
      await redis.set(`chat:${senderId}`, "HUMAN");
      await redis.set(`log:${senderId}`, JSON.stringify({ start: Date.now() }));
      sendText(senderId, "📞 Đang kết nối bạn với hỗ trợ viên…");
      sendEndButton(senderId);
      break;

    case "END_CHAT":
      await endSupport(senderId);
      break;
  }
}

// ===== UI =====
function sendMainMenu(senderId) {
  sendButtons(senderId, "Vui lòng chọn nội dung:", [
    { title: "📄 Điều khoản", payload: "TERMS" },
    { title: "⚠️ Vi phạm", payload: "VIOLATIONS" },
    { title: "🔓 Mở khóa tài khoản", payload: "UNLOCK_MENU" }
  ]);

  setTimeout(() => {
    sendButtons(senderId, "Bạn cần thêm hỗ trợ?", [
      { title: "📞 Liên hệ tổng đài", payload: "CONTACT_SUPPORT" }
    ]);
  }, 400);
}

function sendUnlockMenu(senderId) {
  sendButtons(senderId, "🔓 Mở khóa tài khoản cá nhân:", [
    { title: "Thiết bị lạ", payload: "UNLOCK_DEVICE" },
    { title: "Bị đình chỉ", payload: "UNLOCK_DISABLED" },
    { title: "Bị chiếm quyền", payload: "HACKED_MENU" }
  ]);
}

function sendEndButton(senderId) {
  sendButtons(senderId, "Bạn muốn kết thúc hỗ trợ?", [
    { title: "Kết thúc", payload: "END_CHAT" }
  ]);
}

// ===== SUPPORT END =====
async function endSupport(senderId) {
  const logKey = `log:${senderId}`;
  const log = await redis.get(logKey);

  if (log) {
    const data = JSON.parse(log);
    const duration = Math.floor((Date.now() - data.start) / 1000);
    await redis.del(logKey);
    sendText(senderId, `⏱️ Thời gian hỗ trợ: ${duration} giây`);
  }

  await redis.set(`chat:${senderId}`, "BOT");
  sendMainMenu(senderId);
}

// ===== HELPERS =====
function sendButtons(senderId, text, buttons) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
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
  ).catch(() => {});
}

function sendText(senderId, text) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: { text }
    }
  ).catch(() => {});
}

// ===== ROOT =====
app.get("/", (_, res) => res.send("Messenger bot running"));

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot running on port", PORT));
