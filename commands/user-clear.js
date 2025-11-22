export default function (bot, db, saveDB) {
  const clearSessions = {};

  bot.onText(/^\/clear$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: "🗑️ Bersihkan Chat", callback_data: "clear_chat_now" }],
        [{ text: "❌ Batal", callback_data: "clear_cancel" }]
      ]
    };

    const message = `🧹 *BERSIHKAN CHAT*\n\nKlik tombol di bawah untuk:\n✓ Hapus semua pesan sebelumnya\n✓ Lanjutkan dengan fresh start\n\n_Gunakan fitur ini untuk rapihkan chat!_ 😊`;

    const sentMsg = await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    clearSessions[userId] = {
      messageId: sentMsg.message_id,
      chatId: chatId,
      timestamp: Date.now()
    };
  });

  bot.on('callback_query', async (query) => {
    if (query.data === 'clear_chat_now') {
      const userId = query.from.id;
      const chatId = query.message.chat.id;

      try {
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 300));
        const freshMsg = await bot.sendMessage(
          chatId,
          `✨ *Chat Berhasil Dibersihkan!*\n\n💫 Siap melanjutkan dengan fresh start!\n\nGunakan /start untuk menu utama 😊`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
        await bot.answerCallbackQuery(query.id, "✅ Chat berhasil dibersihkan!", true);
        delete clearSessions[userId];
      } catch (err) {
        console.error("Clear chat error:", err);
        await bot.answerCallbackQuery(query.id, "❌ Gagal membersihkan chat", true);
      }
    } else if (query.data === 'clear_cancel') {
      const userId = query.from.id;
      const chatId = query.message.chat.id;

      try {
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        await bot.answerCallbackQuery(query.id);
        delete clearSessions[userId];
      } catch (err) {
        console.error("Cancel clear error:", err);
        await bot.answerCallbackQuery(query.id);
      }
    }
  });
}
