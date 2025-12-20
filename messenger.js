const axios = require("axios");
const PAGE_TOKEN = process.env.PAGE_TOKEN;

const userLang = {}; // lưu ngôn ngữ user

async function send(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

async function sendButtons(psid, text, buttons) {
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

/* ========= LANGUAGE ========= */
async function languageMenu(psid) {
  return sendButtons(psid, "Choose language / Chọn ngôn ngữ", [
    { type: "postback", title: "Tiếng Việt", payload: "LANG_VI" },
    { type: "postback", title: "English", payload: "LANG_EN" }
  ]);
}

/* ========= MAIN MENU ========= */
async function mainMenu(psid) {
  const vi = userLang[psid] === "vi";

  return sendButtons(
    psid,
    vi ? "Vui lòng chọn nội dung hỗ trợ" : "Please choose support content",
    [
      {
        type: "postback",
        title: vi ? "Tiêu chuẩn cộng đồng" : "Community Standards",
        payload: "COMMUNITY"
      },
      {
        type: "postback",
        title: vi ? "Mở khóa tài khoản" : "Unlock account",
        payload: "UNLOCK"
      },
      {
        type: "postback",
        title: vi ? "Tài khoản bị chiếm quyền" : "Hacked account",
        payload: "HACKED"
      },
      {
        type: "postback",
        title: vi ? "Liên hệ hỗ trợ" : "Contact support",
        payload: "CONTACT"
      }
    ]
  );
}

/* ========= CONTENT ========= */
async function community(psid) {
  return sendButtons(psid, "Thông tin Tiêu chuẩn cộng đồng Facebook", [
    {
      type: "web_url",
      title: "Xem hướng dẫn",
      url: "https://transparency.meta.com/vi-vn/policies/community-standards/"
    }
  ]);
}

async function unlock(psid) {
  return sendButtons(psid, "Hướng dẫn mở khóa tài khoản Facebook", [
    {
      type: "web_url",
      title: "Tài khoản bị khóa",
      url: "https://m.facebook.com/help/669497174142663"
    },
    {
      type: "web_url",
      title: "Tài khoản bị đình chỉ",
      url: "https://m.facebook.com/help/103873106370583"
    }
  ]);
}

async function hacked(psid) {
  return sendButtons(psid, "Hướng dẫn lấy lại tài khoản bị chiếm quyền", [
    {
      type: "web_url",
      title: "Bắt đầu khôi phục",
      url: "https://m.facebook.com/hacked"
    }
  ]);
}

async function contact(psid) {
  return sendButtons(psid, "Liên hệ bộ phận hỗ trợ", [
    {
      type: "web_url",
      title: "Trung tâm trợ giúp",
      url: "https://www.facebook.com/help"
    }
  ]);
}

/* ========= HANDLERS ========= */
async function handleMessage(psid, message) {
  return languageMenu(psid);
}

async function handlePostback(psid, payload) {
  switch (payload) {
    case "GET_STARTED":
      return languageMenu(psid);
    case "LANG_VI":
      userLang[psid] = "vi";
      return mainMenu(psid);
    case "LANG_EN":
      userLang[psid] = "en";
      return mainMenu(psid);
    case "COMMUNITY":
      return community(psid);
    case "UNLOCK":
      return unlock(psid);
    case "HACKED":
      return hacked(psid);
    case "CONTACT":
      return contact(psid);
  }
}

module.exports = { handleMessage, handlePostback };
