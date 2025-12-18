const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const Redis = require("ioredis");

const app = express();
app.use(bodyParser.json());

// ================= ENV =================
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const REDIS_URL = process.env.REDIS_URL;

// ================= REDIS =================
const redis = new Redis(REDIS_URL);

// ================= VERIFY WEBHOOK =================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ================= WEBHOOK =================
app.post("/webhook", async (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const senderId = event.sender?.id;
  if (!senderId) return res.sendStatus(200);

  if (event.message?.is_echo) return res.sendStatus(200);

  const state = (await redis.get(`chat:${senderId}`)) || "BOT";

  // ===== ĐANG NỐI TỔNG ĐÀI → BOT IM LẶNG =====
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
    const text = event.message.text.toLowerCase();
    if (["hi", "menu", "start", "bắt đầu"].includes(text)) {
      sendMainMenu(senderId);
    }
  }

  res.sendStatus(200);
});

// ================= PAYLOAD HANDLER =================
async function handlePayload(payload, senderId) {
  switch (payload) {
    case "GET_STARTED":
    case "MENU_MAIN":
      sendMainMenu(senderId);
      break;

    case "TERMS":
      sendText(
        senderId,
        "📄 Điều khoản Facebook:\nhttps://www.facebook.com/policies"
      );
      break;

    case "VIOLATIONS":
      sendText(
        senderId,
        "⚠️ Tiêu chuẩn cộng đồng:\nhttps://transparency.meta.com/vi-vn/policies/community-standards/"
      );
      break;

    // ===== MỞ KHÓA =====
    case "UNLOCK_MENU":
      sendUnlockMenu(senderId);
      break;

    case "UNLOCK_DEVICE":
      sendText(
        senderId,
        "🔐 Tài khoản bị khóa do thiết bị lạ:\nhttps://m.facebook.com/help/669497174142663?locale=vi_VN&locale2=en_US"
      );
      break;

    case "UNLOCK_DISABLED":
      sendText(
        senderId,
        "⛔ Tài khoản bị đình chỉ:\nVui lòng chuẩn bị Email, SĐT và CCCD chính chủ.\n\n👉 Hướng dẫn:\nhttps://m.facebook.com/help/103873106370583/list?locale=vi_VN&locale2=en_US"
      );
      break;

    // ===== LẤY LẠI TÀI KHOẢN =====
    case "HACKED_MENU":
      sendHackedConfirm(senderId);
      break;

    case "HACKED_YES":
      sendText(
        senderId,
        "🔁 Lấy lại tài khoản bị chiếm quyền:\nhttps://m.facebook.com/hacked"
      );
      break;

    case "HACKED_NO":
      sendText(
        senderId,
        "❌ Rất tiếc, chúng tôi không thể xử lý khi thiết bị không phải chính chủ."
      );
      break;

    // ===== TỔNG ĐÀI =====
    case "CONTACT_SUPPORT":
      await startSupport(senderId);
      break;

    case "END_CHAT":
      await endSupport(senderId);
      break;
  }
}

// ================= UI =================
function sendMainMenu(senderId) {
  sendButtons(senderId, "Vui lòng chọn nội dung:", [
    { title: "📄 Điều khoản", payload: "TERMS" },
    { title: "⚠️ Vi phạm", payload: "VIOLATIONS" },
    { title: "🔓 Mở khóa tài khoản", payload: "UNLOCK_MENU" },
  ]);

  setTimeout(() => {
    sendButtons(senderId, "Bạn cần thêm hỗ trợ?", [
      { title: "📞 Liên hệ tổng đài", payload: "CONTACT_SUPPORT" },
    ]);
  }, 400);
}

function sendUnlockMenu(senderId) {
  sendButtons(senderId, "🔓 Mở khóa tài khoản cá nhân:", [
    { title: "Thiết bị lạ đăng nhập", payload: "UNLOCK_DEVICE" },
    { title: "Tài khoản bị đình chỉ", payload: "UNLOCK_DISABLED" },
    { title: "Tài khoản bị chiếm quyền", payload: "HACKED_MENU" },
  ]);
}

function sendHackedConfirm(senderId) {
  sendButtons(
    senderId,
    "Thiết bị của bạn có phải thiết bị chính chủ thường xuyên đăng nhập không?",
    [
      { title: "Có", payload: "HACKED_YES" },
      { title: "Không", payload: "HACKED_NO" },
    ]
  );
}

// ================= SUPPORT =================
async function startSupport(senderId) {
  await redis.set(`chat:${senderId}`, "HUMAN");
  await redis.set(
    `log:${senderId}`,
    JSON.stringify({ start: Date.now() })
  );

  sendText(senderId, "👤 Chúng tôi đang kết nối bạn với hỗ trợ viên.");
  setTimeout(() => sendEndButton(senderId), 400);
}

async function endSupport(senderId) {
  const logKey = `log:${senderId}`;
  const log = await redis.get(logKey);

  if (log) {
    const data = JSON.parse(log);
    const duration = Math.floor((Date.now() - data.start) / 1000);
    sendText(
      senderId,
      `✅ Cuộc trò chuyện đã kết thúc.\n⏱ Thời gian hỗ trợ: ${duration} giây`
    );
    await redis.del(logKey);
  }

  await redis.set(`chat:${senderId}`, "BOT");
  setTimeout(() => sendMainMenu(senderId), 500);
}

// ================= BUTTON HELPERS =================
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
            buttons: buttons.map((b) => ({
              type: "postback",
              title: b.title,
              payload: b.payload,
            })),
          },
        },
      },
    }
  ).catch(() => {});
}

function sendEndButton(senderId) {
  sendButtons(senderId, "Bạn muốn kết thúc cuộc trò chuyện?", [
    { title: "Kết thúc", payload: "END_CHAT" },
  ]);
}

function sendText(senderId, text) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: { text },
    }
  ).catch(() => {});
}

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Messenger bot running");
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Bot running on port " + PORT);
});
