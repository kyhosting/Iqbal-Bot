export default function (bot, db, saveDB) {
  bot.onText(/^\/clear$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const message = `◆◆ CLEAR CHAT ◆◆\n\n╭─❖\n│ ✅ <b>Chat Bersih</b>\n│ ➤ Scroll ke atas untuk melihat chat lama\n│ ➤ Atau buka chat di device lain\n╰───────────────❖`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
