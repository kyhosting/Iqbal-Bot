export default function (bot, db, saveDB) {
  bot.onText(/^\/cekid$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

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

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
