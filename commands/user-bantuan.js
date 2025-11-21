export default function (bot, db, saveDB) {
  bot.onText(/^\/bantuan$/, async (msg) => {
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
          { text: "💬 Chat Owner", url: "https://t.me/Iqbaldev" }
        ],
        [
          { text: "📧 Report Bug", url: "https://t.me/Iqbaldev?text=Report%20Bug:" }
        ],
        [
          { text: "💡 Suggest Fitur", url: "https://t.me/Iqbaldev?text=Feature%20Request:" }
        ],
        [
          { text: "❌ Close", callback_data: "bantuan_close" }
        ]
      ]
    };

    const message = `🆘 *MENU BANTUAN*\n\n` +
      `Ada yang bisa dibantu?\n\n` +
      `Pilih salah satu opsi:\n` +
      `• 💬 Chat Owner - Hubungi owner langsung\n` +
      `• 📧 Report Bug - Laporkan bug atau error\n` +
      `• 💡 Suggest Fitur - Usulkan fitur baru\n\n` +
      `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // Handle inline button callback
  bot.on('callback_query', async (query) => {
    if (query.data === 'bantuan_close') {
      await bot.editMessageText(
        `✅ *Menu Ditutup*\n\nJika ada yang bisa dibantu, ketik /bantuan lagi 😊`,
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown"
        }
      );
      await bot.answerCallbackQuery(query.id);
    }
  });
}
