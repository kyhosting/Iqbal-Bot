import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNER_USERNAME = config.ownerUsername;

  bot.onText(/^\/bantuan$/, async (msg) => {
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

    const bugMessage = `Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:`;
    const errorMessage = `Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:`;
    const featureMessage = `Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:`;

    const bugUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(bugMessage)}`;
    const errorUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(errorMessage)}`;
    const featureUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(featureMessage)}`;

    const keyboard = {
      inline_keyboard: [
        [{ text: "🐞 Lapor Bug", url: bugUrl }],
        [{ text: "⚠️ Bot Error", url: errorUrl }],
        [{ text: "🛠️ Request Fitur", url: featureUrl }],
        [{ text: "💎 Beli VIP", callback_data: "show_vip_list" }],
        [{ text: "💬 Chat Owner", url: `https://t.me/${OWNER_USERNAME}` }]
      ]
    };

    const message = `🆘 *MENU BANTUAN*\n\nAda yang bisa dibantu Kak?\n\n📋 *Pilihan Tersedia:*\n• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n• ⚠️ Bot Error - Laporkan error yang Anda alami\n• 🛠️ Request Fitur - Usulkan fitur baru\n• 💎 Beli VIP - Lihat paket VIP tersedia\n• 💬 Chat Owner - Hubungi owner langsung\n\n_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "show_vip_list") {
      const vip7Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 7 Hari (15K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;
      const vip30Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 30 Hari (35K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;
      const vip1yMessage = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 1 Tahun (100K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;

      const vip7Url = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip7Message)}`;
      const vip30Url = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip30Message)}`;
      const vip1yUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip1yMessage)}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: "💎 VIP 7 Hari — 15K", url: vip7Url }],
          [{ text: "💎 VIP 30 Hari — 35K", url: vip30Url }],
          [{ text: "💎 VIP 1 Tahun — 100K", url: vip1yUrl }],
          [{ text: "🔙 Kembali", callback_data: "back_to_bantuan" }]
        ]
      };

      let message = `💎 *DAFTAR PAKET VIP*\n\n${'═'.repeat(35)}\n\n✨ *PAKET VIP TERSEDIA:*\n\n📌 *PAKET 7 HARI*\n├─ Harga: Rp 15.000\n└─ Akses: Semua fitur selama 7 hari\n\n📌 *PAKET 30 HARI* ⭐ PALING POPULER\n├─ Harga: Rp 35.000\n└─ Akses: Semua fitur selama 30 hari\n\n📌 *PAKET 1 TAHUN*\n├─ Harga: Rp 100.000\n└─ Akses: Semua fitur selama 1 tahun\n\n${'═'.repeat(35)}\n\n🎯 *FITUR VIP YANG DIDAPATKAN:*\n✓ Konversi file tanpa batas\n✓ Ekstrak nomor (unlimited)\n✓ Gabung & split file\n✓ Rapikan & clean data\n✓ Rename & manage file\n✓ Dan fitur premium lainnya!\n\n_Klik tombol di bawah untuk membeli! 😊_`;

      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    }

    else if (data === "back_to_bantuan") {
      const bugMessage = `Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:`;
      const errorMessage = `Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:`;
      const featureMessage = `Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:`;

      const bugUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(bugMessage)}`;
      const errorUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(errorMessage)}`;
      const featureUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(featureMessage)}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: "🐞 Lapor Bug", url: bugUrl }],
          [{ text: "⚠️ Bot Error", url: errorUrl }],
          [{ text: "🛠️ Request Fitur", url: featureUrl }],
          [{ text: "💎 Beli VIP", callback_data: "show_vip_list" }],
          [{ text: "💬 Chat Owner", url: `https://t.me/${OWNER_USERNAME}` }]
        ]
      };

      const message = `🆘 *MENU BANTUAN*\n\nAda yang bisa dibantu Kak?\n\n📋 *Pilihan Tersedia:*\n• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n• ⚠️ Bot Error - Laporkan error yang Anda alami\n• 🛠️ Request Fitur - Usulkan fitur baru\n• 💎 Beli VIP - Lihat paket VIP tersedia\n• 💬 Chat Owner - Hubungi owner langsung\n\n_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    }
  });
}
