const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_TOKEN;

// Lưu ngôn ngữ theo user
const userLang = {};

// ================= SEND API =================
async function callSendAPI(payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    payload
  );
}

// ================= TEXT =================
async function sendText(psid, text) {
  return callSendAPI({
    recipient: { id: psid },
    message: { text }
  });
}

// ================= LANGUAGE =================
async function sendLanguageMenu(psid) {
  return callSendAPI({
    recipient: { id: psid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Choose language / Chọn ngôn ngữ",
          buttons: [
            {
              type: "postback",
              title: "Tiếng Việt",
              payload: "LANG_VI"
            },
            {
              type: "postback",
              title: "English",
              payload: "LANG_EN"
            }
          ]
        }
      }
    }
  });
}

// ================= MAIN MENU =================
async function sendMainMenu(psid) {
  const lang = userLang[psid] || "vi";

  const text =
    lang === "vi"
      ? "Vui lòng chọn nội dung bạn cần hỗ trợ"
      : "Please choose the support content";

  return callSendAPI({
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
              title:
                lang === "vi"
                  ? "Điều khoản & Tiêu chuẩn"
                  : "Terms & Community Standards",
              payload: "POLICY"
            },
            {
              type: "postback",
              title:
                lang === "vi"
                  ? "Mở khoá tài khoản"
                  : "Unlock Facebook Account",
              payload: "UNLOCK"
            },
            {
              type: "postback",
              title:
                lang === "vi"
                  ? "Tài khoản bị chiếm quyền"
                  : "Hacked Account",
              payload: "HACKED"
            }
          ]
        }
      }
    }
  });
}

// ================= POLICY =================
async function sendPolicy(psid) {
  return sendText(
    psid,
    "Tại đây bạn có thể tìm hiểu:\n\n- Tiêu chuẩn cộng đồng Facebook\n- Điều khoản sử dụng\n- Các lỗi vi phạm phổ biến\n\nNếu cần hỗ trợ thêm, vui lòng chọn Liên hệ hỗ trợ."
  );
}

// ================= UNLOCK =================
async function sendUnlock(psid) {
  return sendText(
    psid,
    "Hỗ trợ mở khoá tài khoản Facebook:\n\n- Tài khoản bị khoá tạm thời\n- Khoá do xác minh danh tính\n- Khoá do vi phạm tiêu chuẩn\n\nVui lòng chuẩn bị giấy tờ xác minh theo hướng dẫn."
  );
}

// ================= HACKED =================
async function sendHacked(psid) {
  return sendText(
    psid,
    "Hỗ trợ tài khoản bị chiếm quyền:\n\n- Bị đổi email / mật khẩu\n- Bị đăng bài trái phép\n- Không đăng nhập được\n\nVui lòng làm theo các bước khôi phục bảo mật."
  );
}

// ================= SUPPORT =================
async function sendSupport(psid) {
  return sendText(
    psid,
    "Yêu cầu của bạn đã được ghi nhận.\nBộ phận hỗ trợ sẽ phản hồi trong thời gian sớm nhất."
  );
}

// ================= HANDLE MESSAGE =================
async function handleMessage(psid, message) {
  if (message.text) {
    return sendLanguageMenu(psid);
  }
}

// ================= HANDLE POSTBACK =================
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

    case "POLICY":
      return sendPolicy(psid);

    case "UNLOCK":
      return sendUnlock(psid);

    case "HACKED":
      return sendHacked(psid);

    case "SUPPORT":
      return sendSupport(psid);
  }
}

module.exports = {
  handleMessage,
  handlePostback
};
