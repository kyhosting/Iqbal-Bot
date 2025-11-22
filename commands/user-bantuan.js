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
        `◆◆ BANTUAN ◆◆\n\n╭─❖\n│ ⚠️ <b>Akses Ditolak</b>\n│ ➤ Harus join grup terlebih dahulu\n╰───────────────❖`,
        { parse_mode: "HTML" }
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

    const message = `◆◆ MENU BANTUAN ◆◆\n\n╭─❖\n│ 🆘 <b>Ada Yang Bisa Dibantu?</b>\n│ ➤ 🐞 Lapor Bug - Laporkan bug\n│ ➤ ⚠️ Bot Error - Laporkan error\n│ ➤ 🛠️ Request Fitur - Usulkan fitur\n│ ➤ 💎 Beli VIP - Lihat paket\n│ ➤ 💬 Chat Owner - Hubungi owner\n╰───────────────❖`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "show_vip_list") {
      const vip7Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 7 Hari (15K)\n• User ID: ${userId}\n\nMohon diproses 🙏`;
      const vip30Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 30 Hari (35K)\n• User ID: ${userId}\n\nMohon diproses 🙏`;
      const vip1yMessage = `Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 1 Tahun (100K)\n• User ID: ${userId}\n\nMohon diproses 🙏`;

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

      let message = `◆◆ PAKET VIP ◆◆\n\n╭─❖\n│ 💎 <b>TERSEDIA</b>\n`;
      message += `│ ➤ VIP 7 Hari: 15K\n`;
      message += `│ ➤ VIP 30 Hari: 35K (POPULER)\n`;
      message += `│ ➤ VIP 1 Tahun: 100K\n`;
      message += `╰───────────────❖\n\n`;
      message += `╭─❖\n│ ✨ <b>FITUR VIP</b>\n`;
      message += `│ ✓ Konversi file tanpa batas\n`;
      message += `│ ✓ Ekstrak nomor unlimited\n`;
      message += `│ ✓ Gabung & split file\n`;
      message += `│ ✓ Rapikan & clean data\n`;
      message += `│ ✓ Rename & manage file\n`;
      message += `╰───────────────❖`;

      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    } else if (data === "back_to_bantuan") {
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

      const message = `◆◆ MENU BANTUAN ◆◆\n\n╭─❖\n│ 🆘 <b>Ada Yang Bisa Dibantu?</b>\n│ ➤ 🐞 Lapor Bug - Laporkan bug\n│ ➤ ⚠️ Bot Error - Laporkan error\n│ ➤ 🛠️ Request Fitur - Usulkan fitur\n│ ➤ 💎 Beli VIP - Lihat paket\n│ ➤ 💬 Chat Owner - Hubungi owner\n╰───────────────❖`;

      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    }
  });
}
