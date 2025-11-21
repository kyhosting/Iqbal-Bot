import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNER_ID = config.owner[0];

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
          { text: "🐞 Lapor Bug", callback_data: "lapor_bug" }
        ],
        [
          { text: "⚠️ Bot Error", callback_data: "bot_error" }
        ],
        [
          { text: "🛠️ Request Fitur", callback_data: "feature_request" }
        ],
        [
          { text: "💎 Beli VIP", callback_data: "bantuan_buyvip" }
        ],
        [
          { text: "💬 Chat Owner", url: `https://t.me/${config.ownerUsername}` }
        ],
        [
          { text: "❌ Close", callback_data: "bantuan_close" }
        ]
      ]
    };

    const message = `🆘 *MENU BANTUAN*\n\n` +
      `Ada yang bisa dibantu Kak?\n\n` +
      `📋 *Pilihan Tersedia:*\n` +
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

  // ===== HANDLER: Help Menu Callbacks =====
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    // Lapor Bug
    if (data === "lapor_bug") {
      const ownerMessage = 
        `🐞 *LAPORAN BUG*\n\n` +
        `Halo Owner, saya ingin melaporkan BUG.\n\n` +
        `• User ID: \`${userId}\`\n` +
        `• Username: @${query.from.username || "no username"}\n` +
        `• Nama: ${query.from.first_name || "N/A"}\n\n` +
        `📝 Tulis bug nya disini:`;

      await bot.sendMessage(OWNER_ID, ownerMessage, { parse_mode: "Markdown" });

      const dmLink = `https://t.me/${config.ownerUsername}`;
      const userNotif = 
        `✅ *LAPORAN BUG DIKIRIM*\n\n` +
        `Terima kasih telah melaporkan bug! 🙏\n` +
        `Owner akan segera memeriksa laporan Anda.\n\n` +
        `[Buka DM Owner](${dmLink})`;

      await bot.sendMessage(chatId, userNotif, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Buka DM Owner", url: dmLink }]
          ]
        }
      });

      await bot.answerCallbackQuery(query.id, "✅ Laporan terkirim ke owner!");
    }

    // Bot Error
    else if (data === "bot_error") {
      const ownerMessage = 
        `⚠️ *LAPORAN ERROR BOT*\n\n` +
        `Owner, BOT nya ERROR.\n\n` +
        `• User ID: \`${userId}\`\n` +
        `• Username: @${query.from.username || "no username"}\n` +
        `• Nama: ${query.from.first_name || "N/A"}\n\n` +
        `🔧 Error yang terjadi:`;

      await bot.sendMessage(OWNER_ID, ownerMessage, { parse_mode: "Markdown" });

      const dmLink = `https://t.me/${config.ownerUsername}`;
      const userNotif = 
        `✅ *LAPORAN ERROR DIKIRIM*\n\n` +
        `Terima kasih telah melaporkan error! 🙏\n` +
        `Owner akan segera memeriksanya.\n\n` +
        `[Buka DM Owner](${dmLink})`;

      await bot.sendMessage(chatId, userNotif, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Buka DM Owner", url: dmLink }]
          ]
        }
      });

      await bot.answerCallbackQuery(query.id, "✅ Laporan terkirim ke owner!");
    }

    // Request Fitur
    else if (data === "feature_request") {
      const ownerMessage = 
        `🛠️ *REQUEST FITUR BARU*\n\n` +
        `Halo Owner, saya ingin request fitur baru.\n\n` +
        `• User ID: \`${userId}\`\n` +
        `• Username: @${query.from.username || "no username"}\n` +
        `• Nama: ${query.from.first_name || "N/A"}\n\n` +
        `💡 Fitur yang saya inginkan:`;

      await bot.sendMessage(OWNER_ID, ownerMessage, { parse_mode: "Markdown" });

      const dmLink = `https://t.me/${config.ownerUsername}`;
      const userNotif = 
        `✅ *REQUEST FITUR DIKIRIM*\n\n` +
        `Terima kasih atas saran Anda! 🙏\n` +
        `Owner akan mempertimbangkan fitur ini.\n\n` +
        `[Buka DM Owner](${dmLink})`;

      await bot.sendMessage(chatId, userNotif, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Buka DM Owner", url: dmLink }]
          ]
        }
      });

      await bot.answerCallbackQuery(query.id, "✅ Request terkirim ke owner!");
    }

    // Navigate to Beli VIP
    else if (data === "bantuan_buyvip") {
      await bot.answerCallbackQuery(query.id, "🔄 Membuka menu Beli VIP...");
      // User can use /buyvip command instead
      const msg2 = { from: query.from, chat: { id: chatId }, text: "/buyvip" };
      // Manually trigger buyvip handler
      const buyvipMsg = {
        chat: { id: chatId },
        from: query.from,
        text: "/buyvip"
      };
      
      // Send buyvip menu directly
      const keyboard = {
        inline_keyboard: [
          [{ text: "💎 VIP 7 Hari — 15K", callback_data: "vip_7h" }],
          [{ text: "💎 VIP 30 Hari — 35K", callback_data: "vip_30h" }],
          [{ text: "💎 VIP 1 Tahun — 100K", callback_data: "vip_1y" }],
          [{ text: "❌ Close", callback_data: "buyvip_close" }]
        ]
      };

      let message = `💎 *DAFTAR PAKET VIP*\n\n`;
      message += `${'═'.repeat(35)}\n\n`;
      message += `✨ *PAKET VIP TERSEDIA:*\n\n`;
      
      message += `📌 *PAKET 7 HARI*\n`;
      message += `├─ Harga: Rp 15.000\n`;
      message += `└─ Akses: Semua fitur selama 7 hari\n\n`;

      message += `📌 *PAKET 30 HARI* ⭐ PALING POPULER\n`;
      message += `├─ Harga: Rp 35.000\n`;
      message += `└─ Akses: Semua fitur selama 30 hari\n\n`;

      message += `📌 *PAKET 1 TAHUN*\n`;
      message += `├─ Harga: Rp 100.000\n`;
      message += `└─ Akses: Semua fitur selama 1 tahun\n\n`;

      message += `${'═'.repeat(35)}\n\n`;
      message += `🎯 *FITUR VIP YANG DIDAPATKAN:*\n`;
      message += `✓ Konversi file tanpa batas\n`;
      message += `✓ Ekstrak nomor (unlimited)\n`;
      message += `✓ Gabung & split file\n`;
      message += `✓ Rapikan & clean data\n`;
      message += `✓ Rename & manage file\n`;
      message += `✓ Dan fitur premium lainnya!\n\n`;

      message += `_Pilih paket di bawah! 😊_`;

      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }

    // Close menu
    else if (data === "bantuan_close") {
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.answerCallbackQuery(query.id);
    }
  });
}
