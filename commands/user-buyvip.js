import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNER_ID = config.owner[0];

  const VIP_PACKAGES = {
    vip_7h: { days: 7, price: "15K", priceRp: "Rp 15.000" },
    vip_30h: { days: 30, price: "35K", priceRp: "Rp 35.000" },
    vip_1y: { days: 365, price: "100K", priceRp: "Rp 100.000" }
  };

  // ===== COMMAND: /buyvip =====
  bot.onText(/^\/buyvip$|^💎 BELI VIP$/, async (msg) => {
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
          { text: "💎 VIP 7 Hari — 15K", callback_data: "vip_7h" }
        ],
        [
          { text: "💎 VIP 30 Hari — 35K", callback_data: "vip_30h" }
        ],
        [
          { text: "💎 VIP 1 Tahun — 100K", callback_data: "vip_1y" }
        ],
        [
          { text: "❌ Close", callback_data: "buyvip_close" }
        ]
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

    message += `💳 *CARA PEMBAYARAN:*\n`;
    message += `Transfer ke rekening owner\n`;
    message += `Hubungi owner untuk info detail\n\n`;

    message += `_Pilih paket di bawah! 😊_`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // ===== HANDLER: VIP Button Callbacks =====
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    // Handle VIP package selection
    if (data.startsWith("vip_")) {
      const pkg = VIP_PACKAGES[data];
      
      if (pkg) {
        // Send auto-message to owner
        const ownerMessage = 
          `💎 *PEMBELIAN VIP*\n\n` +
          `Halo Owner, saya ingin membeli VIP.\n\n` +
          `• Harga yang saya pilih: VIP ${pkg.days} Hari — ${pkg.priceRp}\n` +
          `• User ID saya: \`${userId}\`\n` +
          `• Username: @${query.from.username || "no username"}\n` +
          `• Nama: ${query.from.first_name || "N/A"}\n\n` +
          `Mohon diproses ya 🙏`;

        await bot.sendMessage(OWNER_ID, ownerMessage, { parse_mode: "Markdown" });

        // Notify user and provide DM link
        const dmLink = `https://t.me/${config.ownerUsername}`;
        const userNotif = 
          `✅ *PESANAN DITERIMA*\n\n` +
          `Paket: VIP ${pkg.days} Hari (${pkg.priceRp})\n` +
          `Status: Menunggu konfirmasi owner\n\n` +
          `Owner akan menghubungi Anda segera! 😊\n\n` +
          `[Buka DM Owner](${dmLink})`;

        await bot.sendMessage(chatId, userNotif, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 Buka DM Owner", url: dmLink }]
            ]
          }
        });
      }

      await bot.answerCallbackQuery(query.id, "✅ Pesanan terkirim ke owner!");
    }

    // Close button
    else if (data === "buyvip_close") {
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.answerCallbackQuery(query.id);
    }
  });
}
