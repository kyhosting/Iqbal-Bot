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
