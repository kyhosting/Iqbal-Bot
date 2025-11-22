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

  bot.onText(/^\/cekid$/, async (msg) => {
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

    const message = `◆◆  CEK ID  ◆◆

┌─❖
│  🆔 Informasi ID
│
│  User ID: ${userId}
│
│  Chat ID: ${chatId}
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`;

    await trackMessage(userId, chatId, message, { parse_mode: "HTML" });
  });
}
