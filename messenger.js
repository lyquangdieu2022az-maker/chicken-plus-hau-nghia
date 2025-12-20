const axios = require("axios");
const PAGE_TOKEN = process.env.PAGE_TOKEN;

const userLang = {};

async function callSendAPI(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

// ===== TEXT =====
function sendText(psid, text) {
  return callSendAPI({
    recipient: { id: psid },
    message: { text }
  });
}

// ===== LANGUAGE =====
function sendLanguage(psid) {
  return callSendAPI({
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

// ===== MAIN MENU =====
function sendMenu(psid) {
  const vi = userLang[psid] !== "en";

  return callSendAPI({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: vi
            ? "Vui lòng chọn nội dung hỗ trợ"
            : "Please choose support content",
          buttons: [
            { type: "postback", title: "Tiêu chuẩn cộng đồng", payload: "POLICY" },
            { type: "postback", title: "Mở khoá tài khoản", payload: "UNLOCK" },
            { type: "postback", title: "Tài khoản bị chiếm quyền", payload: "HACKED" }
          ]
        }
      }
    }
  });
}

// ===== CONTENT =====
function sendPolicy(psid) {
  return sendText(
    psid,
    "Xem Tiêu chuẩn cộng đồng Facebook:\nhttps://www.facebook.com/communitystandards/"
  );
}

function sendUnlock(psid) {
  return sendText(
    psid,
    "Gửi yêu cầu mở khoá tài khoản:\nhttps://www.facebook.com/help/contact/260749603972907"
  );
}

function sendHacked(psid) {
  return sendText(
    psid,
    "Báo cáo tài khoản bị chiếm quyền:\nhttps://www.facebook.com/hacked"
  );
}

// ===== HANDLER =====
function handleMessage(psid, message) {
  return sendLanguage(psid);
}

function handlePostback(psid, payload) {
  switch (payload) {
    case "GET_STARTED":
      return sendLanguage(psid);
    case "LANG_VI":
      userLang[psid] = "vi";
      return sendMenu(psid);
    case "LANG_EN":
      userLang[psid] = "en";
      return sendMenu(psid);
    case "POLICY":
      return sendPolicy(psid);
    case "UNLOCK":
      return sendUnlock(psid);
    case "HACKED":
      return sendHacked(psid);
  }
}

module.exports = {
  handleMessage,
  handlePostback
};
