const axios = require("axios");
const { t } = require("./i18n");
const { startSupport } = require("./support");

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const userLang = {};

function sendButtons(id, text, buttons) {
  return axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id },
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
    }
  );
}

async function handleMessage(senderId, message) {
  if (!userLang[senderId]) {
    return sendButtons(senderId, "🌐 Chọn ngôn ngữ / Choose language", [
      { type: "postback", title: "🇻🇳 Tiếng Việt", payload: "LANG_VI" },
      { type: "postback", title: "🇺🇸 English", payload: "LANG_EN" }
    ]);
  }

  sendMainMenu(senderId);
}

function sendMainMenu(senderId) {
  const lang = userLang[senderId];
  sendButtons(senderId, t(lang, "mainMenu"), [
    { type: "postback", title: "🔓 Mở khóa", payload: "UNLOCK" },
    { type: "postback", title: "🛑 Bị chiếm quyền", payload: "HACKED" },
    { type: "postback", title: "📞 CSKH VIP", payload: "SUPPORT" }
  ]);
}

async function handlePostback(senderId, payload) {
  if (payload === "LANG_VI") {
    userLang[senderId] = "vi";
    return sendMainMenu(senderId);
  }
  if (payload === "LANG_EN") {
    userLang[senderId] = "en";
    return sendMainMenu(senderId);
  }

  const lang = userLang[senderId] || "vi";

  switch (payload) {
    case "UNLOCK":
      sendButtons(senderId, t(lang, "unlock"), [
        {
          type: "web_url",
          title: "Thiết bị lạ",
          url: "https://m.facebook.com/help/669497174142663"
        },
        {
          type: "web_url",
          title: "Bị đình chỉ",
          url: "https://m.facebook.com/help/103873106370583"
        }
      ]);
      break;

    case "HACKED":
      sendButtons(senderId, t(lang, "hacked"), [
        {
          type: "web_url",
          title: "Lấy lại tài khoản",
          url: "https://m.facebook.com/hacked"
        }
      ]);
      break;

    case "SUPPORT":
      startSupport(senderId);
      break;
  }
}

module.exports = { handleMessage, handlePostback };
