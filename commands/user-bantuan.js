import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNER_USERNAME = config.ownerUsername;

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

    // Create deep-link URLs dengan pesan pre-filled
    const bugMessage = `Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:`;
    const errorMessage = `Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:`;
    const featureMessage = `Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:`;

    const bugUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(bugMessage)}`;
    const errorUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(errorMessage)}`;
    const featureUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(featureMessage)}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🐞 Lapor Bug", url: bugUrl }
        ],
        [
          { text: "⚠️ Bot Error", url: errorUrl }
        ],
        [
          { text: "🛠️ Request Fitur", url: featureUrl }
        ],
        [
          { text: "💎 Beli VIP", url: `https://t.me/${OWNER_USERNAME}?text=/buyvip` }
        ],
        [
          { text: "💬 Chat Owner", url: `https://t.me/${OWNER_USERNAME}` }
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
}
