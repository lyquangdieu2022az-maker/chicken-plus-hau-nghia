const express = require("express");
const bodyParser = require("body-parser");
const Redis = require("ioredis");
const { sendButtons, sendText } = require("./services/messenger");
const { t, setLang, getLang } = require("./services/i18n");
const { startSupport, endSupport } = require("./services/support");

const app = express();
app.use(bodyParser.json());

const redis = new Redis(process.env.REDIS_URL);

// Verify
app.get("/webhook", (req, res) => {
  const { "hub.mode": m, "hub.verify_token": v, "hub.challenge": c } = req.query;
  return (m==="subscribe" && v===process.env.VERIFY_TOKEN) ? res.send(c) : res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const ev = req.body.entry?.[0]?.messaging?.[0];
  if (!ev || ev.message?.is_echo) return res.sendStatus(200);
  const uid = ev.sender.id;
  const state = (await redis.get(`state:${uid}`)) || "BOT";

  if (state === "HUMAN") {
    if (ev.postback?.payload === "END_CHAT") await endSupport(uid);
    return res.sendStatus(200);
  }

  if (ev.postback) {
    const p = ev.postback.payload;
    if (p === "GET_STARTED") {
      return sendButtons(uid, "Choose language / Chọn ngôn ngữ", [
        {title:"Tiếng Việt", payload:"LANG_VI"},
        {title:"English", payload:"LANG_EN"}
      ]);
    }
    if (p === "LANG_VI") { await setLang(uid,"vi"); return mainMenu(uid); }
    if (p === "LANG_EN") { await setLang(uid,"en"); return mainMenu(uid); }

    if (p === "MENU_MAIN") return mainMenu(uid);
    if (p === "UNLOCK_MENU") return unlockMenu(uid);
    if (p === "UNLOCK_DEVICE") return sendText(uid, t(uid,"unlock_device"));
    if (p === "UNLOCK_DISABLED") return sendText(uid, t(uid,"unlock_disabled"));
    if (p === "HACKED_MENU") return hackedConfirm(uid);
    if (p === "HACKED_YES") return sendText(uid, t(uid,"hacked_yes"));
    if (p === "HACKED_NO") return sendText(uid, t(uid,"hacked_no"));
    if (p === "TERMS") return sendText(uid, t(uid,"terms"));
    if (p === "VIOLATIONS") return sendText(uid, t(uid,"violations"));
    if (p === "CONTACT_SUPPORT") return startSupport(uid);
  }

  res.sendStatus(200);
});

function mainMenu(uid){
  return sendButtons(uid, t(uid,"menu_title"), [
    {title:t(uid,"menu_unlock"), payload:"UNLOCK_MENU"},
    {title:t(uid,"menu_terms"), payload:"TERMS"},
    {title:t(uid,"menu_violations"), payload:"VIOLATIONS"},
    {title:t(uid,"menu_support"), payload:"CONTACT_SUPPORT"}
  ]);
}
function unlockMenu(uid){
  return sendButtons(uid, t(uid,"unlock_title"), [
    {title:t(uid,"unlock_device_btn"), payload:"UNLOCK_DEVICE"},
    {title:t(uid,"unlock_disabled_btn"), payload:"UNLOCK_DISABLED"},
    {title:t(uid,"unlock_hacked_btn"), payload:"HACKED_MENU"}
  ]);
}
function hackedConfirm(uid){
  return sendButtons(uid, t(uid,"hacked_q"), [
    {title:t(uid,"yes"), payload:"HACKED_YES"},
    {title:t(uid,"no"), payload:"HACKED_NO"}
  ]);
}

app.get("/", (_,res)=>res.send("Messenger bot running"));
app.listen(process.env.PORT||3000);
