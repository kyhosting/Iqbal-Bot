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
          { text: "🐞 Lapor Bug", callback_data: "bug_report" },
          { text: "⚠️ Bot Error", callback_data: "bot_error" }
        ],
        [
          { text: "🛠️ Request Fitur", callback_data: "feature_request" }
        ],
        [
          { text: "💎 Beli VIP", callback_data: "report_buyvip_menu" }
        ],
        [
          { text: "💬 Chat Owner", url: "https://t.me/Iqbaldev" }
        ],
        [
          { text: "❌ Close", callback_data: "report_close" }
        ]
      ]
    };

    const message = `🆘 *MENU BANTUAN*\n\n` +
      `Ada yang bisa dibantu Kak?\n\n` +
      `Pilih salah satu opsi:\n` +
      `• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n` +
      `• ⚠️ Bot Error - Laporkan error yang Anda alami\n` +
      `• 🛠️ Request Fitur - Usulkan fitur baru\n` +
      `• 💎 Beli VIP - Lihat paket VIP tersedia\n` +
      `• 💬 Chat Owner - Hubungi owner langsung\n\n` +
      `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });
}
