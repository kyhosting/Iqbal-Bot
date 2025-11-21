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

    // Create deep-link URLs with user ID and pre-filled messages
    const bugReportUrl = `https://t.me/${OWNER_USERNAME}?text=Halo%20Owner,%20ID%20saya%20${userId}.%20Saya%20ingin%20lapor%20bug.`;
    const botErrorUrl = `https://t.me/${OWNER_USERNAME}?text=Woi%20Owner,%20ID%20saya%20${userId}.%20Botnya%20error%20tuh.`;
    const featureRequestUrl = `https://t.me/${OWNER_USERNAME}?text=Halo%20Owner,%20ID%20saya%20${userId}.%20Saya%20request%20fitur%20baru.`;
    const ownerUrl = `https://t.me/${OWNER_USERNAME}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🐞 Lapor Bug", url: bugReportUrl }
        ],
        [
          { text: "⚠️ Bot Error", url: botErrorUrl }
        ],
        [
          { text: "🛠️ Request Fitur", url: featureRequestUrl }
        ],
        [
          { text: "💎 Beli VIP", url: `https://t.me/${OWNER_USERNAME}/buyvip` }
        ],
        [
          { text: "💬 Chat Owner", url: ownerUrl }
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
