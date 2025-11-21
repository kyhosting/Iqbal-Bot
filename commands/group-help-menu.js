export default function (bot, db, saveDB) {
  bot.onText(/^\/help$|^❓ HELP$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    let helpMsg = `❓ *HELP MENU*\n\n`;
    helpMsg += `👤 *Your Status:* ${isVIP ? "💎 VIP" : isOwner ? "👑 Owner" : "👤 User"}\n\n`;

    // User commands
    helpMsg += `📋 *USER COMMANDS:*\n`;
    helpMsg += `/start - Welcome & info\n`;
    helpMsg += `/bantuan - Lapor bug/error/request fitur\n`;
    helpMsg += `/vip - Beli VIP membership\n`;
    helpMsg += `/vip_status - Cek VIP Anda\n`;
    helpMsg += `/me - Info akun Anda\n`;
    helpMsg += `/stats - Statistik bot\n`;
    helpMsg += `/leaderboard - Top 10 converters\n`;
    helpMsg += `/help - Menu bantuan ini\n\n`;

    // Group commands (admin)
    if (isOwner || msg.chat.type === "group") {
      helpMsg += `⚙️ *GROUP COMMANDS (Admin):*\n`;
      helpMsg += `/admin_panel - Buka admin panel\n`;
      helpMsg += `/welcome_setup - Setup welcome message\n`;
      helpMsg += `/file_logs - Lihat file operations\n`;
      helpMsg += `/cleanup_files - Cleanup old files\n`;
      helpMsg += `/lapor_admin - Lapor admin\n\n`;
    }

    // VIP commands
    if (isVIP || isOwner) {
      helpMsg += `💎 *VIP FEATURES:*\n`;
      helpMsg += `• Unlimited file conversion\n`;
      helpMsg += `• Priority support\n`;
      helpMsg += `• VIP badge di grup\n`;
      helpMsg += `• All premium commands\n`;
      helpMsg += `• Ad-free experience\n\n`;
    } else {
      helpMsg += `💎 *UPGRADE TO VIP:*\n`;
      helpMsg += `Unlock premium features!\n`;
      helpMsg += `Ketik /vip untuk lihat paket.\n\n`;
    }

    // Owner commands
    if (isOwner) {
      helpMsg += `👑 *OWNER COMMANDS:*\n`;
      helpMsg += `/ownerpanel - Owner management\n`;
      helpMsg += `/file_logs - View all file logs\n`;
      helpMsg += `/broadcast - Send message ke semua\n\n`;
    }

    helpMsg += `📞 *SUPPORT:*\n`;
    helpMsg += `Ada masalah? Gunakan /bantuan untuk:\n`;
    helpMsg += `• 🐞 Report bugs\n`;
    helpMsg += `• ⚠️ Report errors\n`;
    helpMsg += `• 🛠️ Request features\n`;
    helpMsg += `• 💬 Chat owner directly\n\n`;

    helpMsg += `_Bot dibuat oleh Iqbaldev dengan ❤️_`;

    bot.sendMessage(chatId, helpMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 Beli VIP", callback_data: "vip_menu" },
            { text: "📞 Bantuan", callback_data: "bantuan_menu" }
          ],
          [
            { text: "📊 Stats", callback_data: "stats_menu" },
            { text: "🏆 Leaderboard", callback_data: "lb_menu" }
          ]
        ]
      }
    });
  });

  // FAQ command
  bot.onText(/^\/faq$/, async (msg) => {
    const faqMsg = `📖 *FAQ - PERTANYAAN UMUM*\n\n` +
      `❓ *Apakah VIP worth?*\n` +
      `✅ Banget! Unlimited features, priority support, badge.\n\n` +
      `❓ *Berapa lama VIP aktif?*\n` +
      `7/30/365 hari sesuai paket yang dibeli.\n\n` +
      `❓ *Bagaimana cara convert file?*\n` +
      `Upload file → pilih tipe konversi → bot proses → download.\n\n` +
      `❓ *Apakah data aman?*\n` +
      `✅ Semua file auto-delete setelah diproses.\n\n` +
      `❓ *Bagaimana join grup?*\n` +
      `Klik link di /bantuan untuk join @agentviber12 & @channelviber.\n\n` +
      `_Pertanyaan lain? Lapor ke /bantuan!_`;

    bot.sendMessage(msg.chat.id, faqMsg, { parse_mode: "Markdown" });
  });
}
