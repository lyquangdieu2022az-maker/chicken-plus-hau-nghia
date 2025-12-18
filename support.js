const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);
const { sendButtons, sendText } = require("./messenger");
const { sendMail } = require("./mailer");

async function startSupport(uid){
  await redis.set(`state:${uid}`,"HUMAN","EX",900);
  await redis.set(`log:${uid}`, JSON.stringify({start:Date.now()}));
  sendText(uid,"👤 Đang kết nối hỗ trợ viên.");
  sendButtons(uid,"Kết thúc khi hoàn tất",[{title:"Kết thúc", payload:"END_CHAT"}]);
}
async function endSupport(uid){
  const log = JSON.parse((await redis.get(`log:${uid}`))||"{}");
  const dur = log.start ? Math.floor((Date.now()-log.start)/1000):0;
  await sendMail(`Ticket ${uid}`, `Duration: ${dur}s`);
  await redis.del(`log:${uid}`);
  await redis.set(`state:${uid}`,"BOT");
  sendText(uid,`Cuộc trò chuyện đã kết thúc. (${dur}s)`);
}
module.exports = { startSupport, endSupport };
