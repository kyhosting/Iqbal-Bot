export default function (bot, db, saveDB) {
  bot.onText(/^\/cekid$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const message = `◆◆ CEK ID ◆◆\n\n┌─❖\n├ 🆔 <b>Informasi ID</b>\n├ ➤ User ID Kamu: <code>${userId}</code>\n├ ➤ Chat ID: <code>${chatId}</code>\n└─❖`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
