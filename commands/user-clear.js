export default function (bot, db, saveDB) {
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

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
