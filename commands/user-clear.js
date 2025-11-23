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

export default function (bot, db, saveDB) {
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

  bot.onText(/^\/clear$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk VIP users kak!
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    const message = `◆◆  CLEAR CHAT  ◆◆

┌─❖
│  ✅ Chat Bersih
│
│  Scroll ke atas untuk chat lama
│
│  Atau buka di device lain
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`;

    await trackMessage(userId, chatId, message, { parse_mode: "HTML" });
  });
}
