export default function (bot, db, saveDB) {
  const clearSessions = {}; // Track user's clearable messages

  bot.onText(/^\/clear$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
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
        [
          { text: "🗑️ Bersihkan Chat", callback_data: "clear_chat" }
        ],
        [
          { text: "❌ Batal", callback_data: "clear_cancel" }
        ]
      ]
    };

    const message = `🧹 *BERSIHKAN CHAT*\n\n` +
      `Fitur ini akan membantu merapikan chat\n` +
      `dengan menghapus pesan sebelumnya.\n\n` +
      `💡 *Catatan:*\n` +
      `Sistem Telegram hanya memungkinkan\n` +
      `bot menghapus pesan yang dikirim oleh bot.\n\n` +
      `Klik tombol di bawah untuk mulai:`;

    const sentMsg = await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    clearSessions[userId] = {
      messageIds: [sentMsg.message_id],
      chatId: chatId
    };
  });

  // Handle inline button callbacks
  bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;

    if (query.data === 'clear_chat') {
      try {
        // Delete the inline keyboard message first
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

        // Try to delete previous bot messages in this session
        const session = clearSessions[userId];
        if (session && session.messageIds) {
          for (const msgId of session.messageIds) {
            try {
              await bot.deleteMessage(chatId, msgId).catch(() => {});
            } catch (e) {}
          }
        }

        // Send clean welcome message
        const cleanMsg = await bot.sendMessage(
          chatId,
          `✅ *Chat Berhasil Dibersihkan!*\n\nKamu siap melanjutkan dengan fresh start! 😊\n\nGunakan /start untuk menu utama.`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );

        // Update session with new message ID
        clearSessions[userId] = {
          messageIds: [cleanMsg.message_id],
          chatId: chatId
        };

        await bot.answerCallbackQuery(query.id, "✅ Chat dibersihkan!", true);
      } catch (err) {
        console.error("Clear chat error:", err);
        await bot.answerCallbackQuery(query.id, "❌ Gagal membersihkan chat", true);
      }
    } else if (query.data === 'clear_cancel') {
      try {
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        const cancelMsg = await bot.sendMessage(
          chatId,
          `❌ *Dibatalkan*\n\nBersihkan chat dibatalkan.`,
          { parse_mode: "Markdown" }
        );
        await bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error("Cancel clear error:", err);
        await bot.answerCallbackQuery(query.id);
      }
    }
  });
}
