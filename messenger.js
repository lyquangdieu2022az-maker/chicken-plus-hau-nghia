const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_TOKEN;

const userLang = {}; // lưu ngôn ngữ theo userId

// ================== SEND API ==================
async function callSendAPI(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

// ================== TEXT ==================
async function sendText(psid, text) {
  await callSendAPI({
    recipient: { id: psid },
    message: { text }
  });
}

// ================== LANGUAGE MENU ==================
async function sendLanguageMenu(psid) {
  await callSendAPI({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "🌐 Choose language / Chọn ngôn ngữ",
          buttons: [
            {
              type: "postback",
              title: "🇻🇳 Tiếng Việt",
              payload: "LANG_VI"
            },
            {
              type: "postback",
              title: "🇺🇸 English",
              payload: "LANG_EN"
            }
          ]
        }
      }
    }
  });
}

// ================== MAIN MENU ==================
async function sendMainMenu(psid) {
  const lang = userLang[psid] || "vi";

  const text =
    lang === "vi"
      ? "👋 Chào mừng bạn đến FB Community VN\nChúng tôi hỗ trợ doanh nghiệp 24/7"
      : "👋 Welcome to FB Community VN\nWe support businesses 24/7";

  await callSendAPI({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons: [
            {
              type: "postback",
              title: lang === "vi" ? "📦 Dịch vụ" : "📦 Services",
              payload: "SERVICES"
            },
            {
              type: "postback",
              title: lang === "vi" ? "💎 Gói VIP" : "💎 VIP Plan",
              payload: "VIP"
            },
            {
              type: "postback",
              title: lang === "vi" ? "👨‍💼 CSKH" : "👨‍💼 Support",
              payload: "SUPPORT"
            }
          ]
        }
      }
    }
  });
}

// ================== SERVICES ==================
async function sendServices(psid) {
  const lang = userLang[psid];

  const text =
    lang === "vi"
      ? "📦 Dịch vụ doanh nghiệp:\n• Chatbot Meta\n• Quản lý Page\n• Xác minh BM"
      : "📦 Business services:\n• Meta Chatbot\n• Page Management\n• Business Verification";

  await sendText(psid, text);
}

// ================== VIP ==================
async function sendVIP(psid) {
  await sendText(
    psid,
    "💎 GÓI VIP DOANH NGHIỆP\n✔ CSKH riêng\n✔ Đa ngôn ngữ\n✔ Email + Messenger\n✔ Ưu tiên 24/7"
  );
}

// ================== SUPPORT ==================
async function sendSupport(psid) {
  await sendText(
    psid,
    " bộ phận hỗ trợ đã nhận yêu cầu của bạn.\nChúng tôi sẽ phản hồi trong ít phút."
  );
}

// ================== HANDLE MESSAGE ==================
async function handleMessage(psid, message) {
  if (message.text) {
    await sendLanguageMenu(psid);
  }
}

// ================== HANDLE POSTBACK ==================
async function handlePostback(psid, payload) {
  switch (payload) {
    case "GET_STARTED":
      return sendLanguageMenu(psid);

    case "LANG_VI":
      userLang[psid] = "vi";
      return sendMainMenu(psid);

    case "LANG_EN":
      userLang[psid] = "en";
      return sendMainMenu(psid);

    case "SERVICES":
      return sendServices(psid);

    case "VIP":
      return sendVIP(psid);

    case "SUPPORT":
      return sendSupport(psid);
  }
}

module.exports = {
  handleMessage,
  handlePostback
};
