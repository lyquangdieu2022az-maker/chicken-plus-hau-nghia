const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const GRAPH_URL = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`;

// ================= VERIFY =================
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
const userState = {}; // BOT | HUMAN
const userLang = {};  // vi | en

app.post("/webhook", async (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const sender = event.sender.id;

  if (event.message?.is_echo) return res.sendStatus(200);

  // nếu đang hỗ trợ người thật → bot im lặng
  if (userState[sender] === "HUMAN") {
    if (event.postback?.payload === "END_SUPPORT") {
      userState[sender] = "BOT";
      sendMainMenu(sender);
    }
    return res.sendStatus(200);
  }

  if (event.postback) {
    handlePayload(sender, event.postback.payload);
  }

  res.sendStatus(200);
});

// ================= HANDLE PAYLOAD =================
function handlePayload(sender, payload) {
  switch (payload) {
    case "GET_STARTED":
      chooseLanguage(sender);
      break;

    case "LANG_VI":
      userLang[sender] = "vi";
      sendMainMenu(sender);
      break;

    case "LANG_EN":
      userLang[sender] = "en";
      sendMainMenu(sender);
      break;

    case "TERMS":
      sendText(sender,
        userLang[sender] === "en"
          ? "Facebook Terms:\nhttps://www.facebook.com/policies"
          : "Điều khoản Facebook:\nhttps://www.facebook.com/policies"
      );
      break;

    case "STANDARDS":
      sendText(sender,
        userLang[sender] === "en"
          ? "Community Standards:\nhttps://transparency.meta.com/policies/community-standards/"
          : "Tiêu chuẩn cộng đồng:\nhttps://transparency.meta.com/vi-vn/policies/community-standards/"
      );
      break;

    case "UNLOCK":
      sendUnlockMenu(sender);
      break;

    case "UNLOCK_DEVICE":
      sendText(sender,
        "https://m.facebook.com/help/669497174142663?locale=vi_VN&locale2=en_US"
      );
      break;

    case "UNLOCK_DISABLED":
      sendText(sender,
        "https://m.facebook.com/help/103873106370583/list?locale=vi_VN&locale2=en_US"
      );
      break;

    case "HACKED":
      sendText(sender, "https://m.facebook.com/hacked");
      break;

    case "SUPPORT":
      userState[sender] = "HUMAN";
      sendSupportEndButton(sender);
      break;
  }
}

// ================= UI =================
function chooseLanguage(sender) {
  sendButtons(sender, "Choose language / Chọn ngôn ngữ", [
    { title: "Tiếng Việt", payload: "LANG_VI" },
    { title: "English", payload: "LANG_EN" }
  ]);
}

function sendMainMenu(sender) {
  userState[sender] = "BOT";
  sendButtons(sender, "Vui lòng chọn nội dung", [
    { title: "Điều khoản", payload: "TERMS" },
    { title: "Tiêu chuẩn cộng đồng", payload: "STANDARDS" },
    { title: "Mở khóa tài khoản", payload: "UNLOCK" },
    { title: "Lấy lại tài khoản", payload: "HACKED" },
    { title: "Liên hệ hỗ trợ", payload: "SUPPORT" }
  ]);
}

function sendUnlockMenu(sender) {
  sendButtons(sender, "Chọn loại mở khóa", [
    { title: "Thiết bị lạ đăng nhập", payload: "UNLOCK_DEVICE" },
    { title: "Tài khoản bị đình chỉ", payload: "UNLOCK_DISABLED" }
  ]);
}

function sendSupportEndButton(sender) {
  sendButtons(sender, "Bạn đang kết nối hỗ trợ", [
    { title: "Kết thúc", payload: "END_SUPPORT" }
  ]);
}

// ================= SEND =================
function sendText(sender, text) {
  axios.post(GRAPH_URL, {
    recipient: { id: sender },
    message: { text }
  }).catch(() => {});
}

function sendButtons(sender, text, buttons) {
  axios.post(GRAPH_URL, {
    recipient: { id: sender },
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
  }).catch(() => {});
}

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Messenger bot running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot running on port", PORT));
