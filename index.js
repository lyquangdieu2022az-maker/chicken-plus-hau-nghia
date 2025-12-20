const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Lưu ngôn ngữ người dùng (tạm thời)
const userLang = {};

// ================= SEND API =================
async function send(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

// ================= LANGUAGE =================
function languageMenu(psid) {
  return send({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Choose language / Chọn ngôn ngữ",
          buttons: [
            { type: "postback", title: "Tiếng Việt", payload: "LANG_VI" },
            { type: "postback", title: "English", payload: "LANG_EN" }
          ]
        }
      }
    }
  });
}

// ================= MAIN MENU =================
function mainMenu(psid) {
  const lang = userLang[psid] || "vi";

  const text =
    lang === "vi"
      ? "Vui lòng chọn nội dung hỗ trợ"
      : "Please choose a support option";

  const buttons =
    lang === "vi"
      ? [
          { type: "postback", title: "Tiêu chuẩn cộng đồng", payload: "POLICY" },
          { type: "postback", title: "Mở khóa tài khoản", payload: "UNLOCK" },
          { type: "postback", title: "Tài khoản bị chiếm quyền", payload: "HACKED" }
        ]
      : [
          { type: "postback", title: "Community Standards", payload: "POLICY" },
          { type: "postback", title: "Unlock Account", payload: "UNLOCK" },
          { type: "postback", title: "Hacked Account", payload: "HACKED" }
        ];

  return send({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons
        }
      }
    }
  });
}

// ================= CONTENT =================
function sendText(psid, text) {
  return send({
    recipient: { id: psid },
    message: { text }
  });
}

// ================= WEBHOOK VERIFY =================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ================= WEBHOOK RECEIVE =================
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (!event) return res.sendStatus(200);

  const psid = event.sender.id;

  // MESSAGE
  if (event.message && event.message.text) {
    await languageMenu(psid);
  }

  // POSTBACK
  if (event.postback) {
    const payload = event.postback.payload;

    switch (payload) {
      case "GET_STARTED":
        await languageMenu(psid);
        break;

      case "LANG_VI":
        userLang[psid] = "vi";
        await mainMenu(psid);
        break;

      case "LANG_EN":
        userLang[psid] = "en";
        await mainMenu(psid);
        break;

      case "POLICY":
        await sendText(psid, "Thông tin về Tiêu chuẩn cộng đồng Facebook.");
        break;

      case "UNLOCK":
        await sendText(psid, "Hướng dẫn gửi yêu cầu mở khóa tài khoản Facebook.");
        break;

      case "HACKED":
        await sendText(psid, "Hướng dẫn xử lý tài khoản Facebook bị chiếm quyền.");
        break;
    }
  }

  res.sendStatus(200);
});

// ================= START =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Bot running on port", PORT);
});
