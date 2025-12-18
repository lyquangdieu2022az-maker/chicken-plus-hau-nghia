const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_TOKEN;

// ===== SEND TEXT =====
async function sendText(psid, text) {
  return axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: psid },
      message: { text }
    }
  );
}

// ===== SEND BUTTON =====
async function sendButtons(psid, text, buttons) {
  return axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      recipient: { id: psid },
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
  );
}

// ===== MAIN MENU =====
async function sendMainMenu(psid) {
  await sendButtons(psid, "Chào mừng bạn đến Trung tâm hỗ trợ Meta VN 🇻🇳", [
    { title: "🔓 Mở khóa tài khoản", payload: "UNLOCK_MENU" },
    { title: "🛡️ Tài khoản bị chiếm quyền", payload: "HACKED_MENU" },
    { title: "📞 Liên hệ CSKH", payload: "CONTACT_SUPPORT" }
  ]);
}

// ===== UNLOCK MENU =====
async function sendUnlockMenu(psid) {
  await sendButtons(psid, "Vui lòng chọn loại khóa:", [
    { title: "Thiết bị lạ đăng nhập", payload: "UNLOCK_DEVICE" },
    { title: "Tài khoản bị đình chỉ", payload: "UNLOCK_DISABLED" }
  ]);
}

module.exports = {
  sendText,
  sendButtons,
  sendMainMenu,
  sendUnlockMenu
};
