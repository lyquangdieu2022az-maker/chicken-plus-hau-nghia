const axios = require("axios");
const PAGE_TOKEN = process.env.PAGE_TOKEN;

const activeSupport = {};

function sendText(id, text) {
  return axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    { recipient: { id }, message: { text } }
  );
}

function startSupport(senderId) {
  activeSupport[senderId] = Date.now();

  sendText(
    senderId,
    "👨‍💼 Hỗ trợ viên đã được kết nối.\n⏳ Thời gian hỗ trợ tối đa: 15 phút"
  );

  setTimeout(() => {
    if (activeSupport[senderId]) {
      delete activeSupport[senderId];
      sendText(senderId, "⏰ Phiên CSKH đã kết thúc. Cảm ơn bạn!");
    }
  }, 15 * 60 * 1000);
}

module.exports = { startSupport };
