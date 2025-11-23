/**
 * 🎌 IQBAL CV BOT - OFFICIAL MODULE 🎌
 * 
 * 🔐 BY: KIFZL & IQBAL DEV
 * 📝 DO NOT RENAME, MODIFY OR REDISTRIBUTE
 * 
 * GitHub: https://github.com/kyhosting/Iqbal-Bot
 * License: MIT (Keep Credits Intact)
 * 
 * ⚠️  Unauthorized modification may result in legal action
 */

import config from "../config.js";

export default function (bot, db, redeemDB, saveDB, saveRedeemDB) {
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  bot.onText(/^\/viplist$|^VIPLIST$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk owner/VIP users kak!
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (!config.owner.includes(userId)) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  VIP LIST  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Command khusus owner
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    const vipUsers = Object.values(db.users).filter(
      (u) => u.role === "vip" && u.vip_expired > Date.now()
    );

    if (vipUsers.length === 0) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  DAFTAR VIP USER  ◆◆

┌─❖
│  ℹ️ Status
│
│  Belum ada user VIP
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    let message = `◆◆  DAFTAR VIP USER (${vipUsers.length})  ◆◆\n\n`;
    vipUsers.forEach((user, i) => {
      const exp = new Date(user.vip_expired).toLocaleDateString("id-ID");
      message += `┌─❖ ${i + 1}\n`;
      message += `│  Nama: ${user.first_name}\n`;
      message += `│  ID: ${user.id}\n`;
      message += `│  Username: @${user.username || "-"}\n`;
      message += `│  Expired: ${exp}\n`;
      message += `└─❖\n`;
    });

    message += `\n┌─❖\n│  Ketik 'done' untuk selesai\n│  Ketik 'batal' untuk batal\n└─❖`;

    await trackMessage(userId, chatId, message, { parse_mode: "HTML" });
  });
}
