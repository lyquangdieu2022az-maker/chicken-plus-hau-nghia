const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

const dict = {
  vi: {
    menu_title:"Vui lòng chọn nội dung",
    menu_unlock:"Mở khóa tài khoản",
    menu_terms:"Điều khoản",
    menu_violations:"Vi phạm",
    menu_support:"Liên hệ tổng đài",
    unlock_title:"Mở khóa tài khoản cá nhân",
    unlock_device_btn:"Thiết bị lạ",
    unlock_disabled_btn:"Bị đình chỉ",
    unlock_hacked_btn:"Tài khoản bị chiếm quyền",
    unlock_device:"Hướng dẫn thiết bị lạ:\nhttps://m.facebook.com/help/669497174142663",
    unlock_disabled:"Chuẩn bị Email/SĐT/CCCD:\nhttps://m.facebook.com/help/103873106370583/list",
    hacked_q:"Thiết bị chính chủ thường xuyên đăng nhập?",
    hacked_yes:"Hướng dẫn lấy lại:\nhttps://m.facebook.com/hacked",
    hacked_no:"Rất tiếc không thể xử lý.",
    terms:"Điều khoản:\nhttps://www.facebook.com/policies",
    violations:"Tiêu chuẩn:\nhttps://transparency.meta.com/vi-vn/policies/community-standards/",
    yes:"Có", no:"Không"
  },
  en: {
    menu_title:"Please choose",
    menu_unlock:"Account recovery",
    menu_terms:"Terms",
    menu_violations:"Violations",
    menu_support:"Contact support",
    unlock_title:"Account recovery",
    unlock_device_btn:"New device",
    unlock_disabled_btn:"Disabled",
    unlock_hacked_btn:"Hacked",
    unlock_device:"Guide:\nhttps://m.facebook.com/help/669497174142663",
    unlock_disabled:"Prepare Email/Phone/ID:\nhttps://m.facebook.com/help/103873106370583/list",
    hacked_q:"Is this your primary device?",
    hacked_yes:"Recover:\nhttps://m.facebook.com/hacked",
    hacked_no:"Sorry, cannot proceed.",
    terms:"Terms:\nhttps://www.facebook.com/policies",
    violations:"Standards:\nhttps://transparency.meta.com/policies/community-standards/",
    yes:"Yes", no:"No"
  }
};

async function setLang(uid, l){ await redis.set(`lang:${uid}`, l); }
async function getLang(uid){ return (await redis.get(`lang:${uid}`)) || "vi"; }
function t(uid, k){ return dict[(dict[uid] ? uid : "vi")]?.[k] || dict.vi[k]; }

module.exports = { setLang, getLang, t };
