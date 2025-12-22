const axios = require("axios");
const { createTicket } = require("./ticket");

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const userLang = {};

async function send(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

// LANGUAGE
function sendLanguage(psid) {
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

// MENU
function sendMenu(psid) {
  const vi = userLang[psid] === "vi";
  return send({
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
            { type: "postback", title: vi ? "Tiêu chuẩn cộng đồng" : "Community Standards", payload: "STANDARD" },
            { type: "postback", title: vi ? "Mở khóa tài khoản" : "Unlock account", payload: "UNLOCK" },
            { type: "postback", title: vi ? "Tài khoản bị chiếm quyền" : "Hacked account", payload: "HACKED" }
          ]
        }
      }
    }
  });
}

function sendText(psid, text) {
  return send({ recipient: { id: psid }, message: { text } });
}

async function handleMessage(psid) {
  if (!userLang[psid]) return sendLanguage(psid);
  return sendMenu(psid);
}

async function handlePostback(psid, payload) {
  if (payload === "GET_STARTED") return sendLanguage(psid);

  if (payload === "LANG_VI") {
    userLang[psid] = "vi";
    return sendMenu(psid);
  }

  if (payload === "LANG_EN") {
    userLang[psid] = "en";
    return sendMenu(psid);
  }

  if (["STANDARD", "UNLOCK", "HACKED"].includes(payload)) {
    await createTicket(psid, payload);
    return sendText(
      psid,
      userLang[psid] === "vi"
        ? "Yêu cầu đã được ghi nhận. Bộ phận hỗ trợ sẽ liên hệ qua email."
        : "Your request has been recorded. Support will contact you via email."
    );
  }
}

module.exports = { handleMessage, handlePostback };
