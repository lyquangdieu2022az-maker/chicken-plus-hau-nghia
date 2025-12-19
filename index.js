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

  // bỏ echo
  if (event.message?.is_echo) return res.sendStatus(200);

  const state = (await redis.get(`chat:${senderId}`)) || "BOT";

  // ===== ĐANG NỐI TỔNG ĐÀI =====
  if (state === "HUMAN") {
    if (event.postback?.payload === "END_CHAT") {
      await redis.set(`chat:${senderId}`, "BOT");
      sendText(
        senderId,
        "Cuộc trò chuyện hỗ trợ đã kết thúc. Bạn có thể tiếp tục sử dụng các tùy chọn hỗ trợ tự động bên dưới."
      );
      setTimeout(() => sendMenu(senderId), 400);
    }
    return res.sendStatus(200);
  }

  // ===== POSTBACK =====
  if (event.postback?.payload) {
    await handlePayload(event.postback.payload, senderId);
    return res.sendStatus(200);
  }

  // ===== TEXT =====
  if (event.message?.text) {
    const text = event.message.text.toLowerCase();
    if (["hi", "menu", "bắt đầu", "start"].includes(text)) {
      sendMenu(senderId);
    }
  }

  res.sendStatus(200);
});

// ================= HANDLE PAYLOAD =================
async function handlePayload(payload, senderId) {
  switch (payload) {
    case "GET_STARTED":
      return sendMenu(senderId);

    case "UNLOCK_MENU":
      return sendUnlockMenu(senderId);

    case "UNLOCK_DEVICE":
      return sendText(
        senderId,
        "Tài khoản của bạn hiện đang bị khóa do hệ thống phát hiện đăng nhập từ thiết bị hoặc vị trí không xác định.\n\n" +
        "Vui lòng thực hiện theo hướng dẫn chính thức tại:\n" +
        "https://m.facebook.com/help/669497174142663?locale=vi_VN&locale2=en_US"
      );

    case "UNLOCK_SUSPENDED":
      return sendText(
        senderId,
        "Tài khoản của bạn đã bị đình chỉ.\n\n" +
        "Vui lòng tham khảo hướng dẫn mở khóa tài khoản bị đình chỉ tại:\n" +
        "https://m.facebook.com/help/103873106370583/list?locale=vi_VN&locale2=en_US"
      );

    case "HACKED_MENU":
      return sendHackedQuestion(senderId);

    case "HACKED_YES":
      return sendText(
        senderId,
        "Nếu bạn đang sử dụng thiết bị chính chủ, vui lòng làm theo hướng dẫn bảo mật tài khoản tại:\n" +
        "https://m.facebook.com/hacked"
      );

    case "HACKED_NO":
      return sendText(
        senderId,
        "Chúng tôi rất tiếc vì không thể hỗ trợ trong trường hợp này.\n\n" +
        "Vui lòng sử dụng thiết bị chính chủ và làm theo hướng dẫn tại:\n" +
        "https://m.facebook.com/hacked"
      );

    case "CONTACT_SUPPORT":
      await redis.set(`chat:${senderId}`, "HUMAN");
      sendText(
        senderId,
        "Bạn đang được kết nối với hỗ trợ viên. Vui lòng chờ trong giây lát."
      );
      setTimeout(() => sendEndButton(senderId), 400);
      break;

    case "END_CHAT":
      await redis.set(`chat:${senderId}`, "BOT");
      sendText(
        senderId,
        "Cuộc trò chuyện hỗ trợ đã kết thúc. Dưới đây là các tùy chọn hỗ trợ tự động."
      );
      sendMenu(senderId);
      break;
  }
}

// ================= MENU =================
function sendMenu(senderId) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Chọn nội dung bạn cần hỗ trợ:",
            buttons: [
              { type: "postback", title: "Mở khóa tài khoản", payload: "UNLOCK_MENU" },
              { type: "postback", title: "Tài khoản bị chiếm quyền", payload: "HACKED_MENU" },
              { type: "postback", title: "Liên hệ hỗ trợ viên", payload: "CONTACT_SUPPORT" }
            ]
          }
        }
      }
    }
  );
}

function sendUnlockMenu(senderId) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Mở khóa tài khoản cá nhân",
            buttons: [
              { type: "postback", title: "Bị khóa do thiết bị lạ", payload: "UNLOCK_DEVICE" },
              { type: "postback", title: "Bị đình chỉ", payload: "UNLOCK_SUSPENDED" }
            ]
          }
        }
      }
    }
  );
}

function sendHackedQuestion(senderId) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text:
              "Chúng tôi phát hiện tài khoản của bạn có dấu hiệu bị chiếm quyền.\n\n" +
              "Thiết bị bạn đang sử dụng có phải là thiết bị chính chủ thường xuyên đăng nhập không?",
            buttons: [
              { type: "postback", title: "Có", payload: "HACKED_YES" },
              { type: "postback", title: "Không", payload: "HACKED_NO" }
            ]
          }
        }
      }
    }
  );
}

function sendEndButton(senderId) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Bạn muốn kết thúc cuộc trò chuyện hỗ trợ?",
            buttons: [
              { type: "postback", title: "Kết thúc", payload: "END_CHAT" }
            ]
          }
        }
      }
    }
  );
}

function sendText(senderId, text) {
  axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: senderId },
      message: { text }
    }
  );
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
