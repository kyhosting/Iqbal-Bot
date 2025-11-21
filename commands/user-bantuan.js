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
          { text: "💎 Beli VIP", callback_data: "bantuan_vip_buy" }
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
      `• 💡 Suggest Fitur - Usulkan fitur baru\n` +
      `• 💎 Beli VIP - Lihat harga VIP\n\n` +
      `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // Handle inline button callbacks
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data === 'bantuan_close') {
      await bot.editMessageText(
        `✅ *Menu Ditutup*\n\nJika ada yang bisa dibantu, ketik /bantuan lagi 😊`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown"
        }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (query.data === 'bantuan_vip_buy') {
      const buyMessage = `SAYA INGIN BELI VIP BOT!\n\nID Telegram: ${userId}`;
      const ownerLink = `https://t.me/Iqbaldev?text=${encodeURIComponent(buyMessage)}`;
      
      await bot.editMessageText(
        `💎 *MENU BELI VIP*\n\n` +
        `Pilih salah satu opsi:\n\n` +
        `📌 /viplist - Lihat daftar harga VIP\n` +
        `💬 Chat Owner - Langsung ke owner\n\n` +
        `_Kami siap melayani! 😊_`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "💎 Lihat Harga VIP", callback_data: "bantuan_show_prices" }],
              [{ text: "💬 Chat Owner", url: ownerLink }],
              [{ text: "🔙 Kembali", callback_data: "bantuan_back" }]
            ]
          }
        }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (query.data === 'bantuan_back') {
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
            { text: "💎 Beli VIP", callback_data: "bantuan_vip_buy" }
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
        `• 💡 Suggest Fitur - Usulkan fitur baru\n` +
        `• 💎 Beli VIP - Lihat harga VIP\n\n` +
        `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      await bot.answerCallbackQuery(query.id);
    } else if (query.data === 'bantuan_show_prices') {
      await bot.answerCallbackQuery(query.id, "🔄 Membuka menu harga VIP...");
      // Will be handled by viplist command when user navigates
    }
  });
}
