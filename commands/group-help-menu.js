export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/help$|^❓ HELP$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    let helpMsg = `❓ *HELP MENU*\n\n`;
    helpMsg += `👤 *Your Status:* ${isVIP ? "💎 VIP" : isOwner ? "👑 Owner" : "👤 User"}\n\n`;

    helpMsg += `📋 *USER COMMANDS:*\n`;
    helpMsg += `/start • /bantuan • /me • /stats\n`;
    helpMsg += `/leaderboard • /vip_status • /faq\n\n`;

    if (isOwner || msg.chat.type === "group") {
      helpMsg += `⚙️ *GROUP ADMIN:*\n`;
      helpMsg += `/admin_panel • /lapor_admin • /file_logs\n\n`;
    }

    if (isVIP || isOwner) {
      helpMsg += `💎 *VIP FEATURES:* Unlimited conversions + Priority support + Badge\n\n`;
    } else {
      helpMsg += `💎 *UPGRADE TO VIP:* Unlock all premium features!\n\n`;
    }

    helpMsg += `📞 *SUPPORT:* Use /bantuan to report bugs or request features.`;

    const sentMsg = await bot.sendMessage(chatId, helpMsg, {
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
          ],
          [
            { text: "📖 FAQ", callback_data: "faq_menu" },
            { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
          ]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // FAQ command
  bot.onText(/^\/faq$/, async (msg) => {
    const faqMsg = `📖 *FAQ - PERTANYAAN UMUM*

❓ *Apakah VIP worth?*
✅ Banget! Unlimited features, priority support, badge.

❓ *Berapa lama VIP aktif?*
7/30/365 hari sesuai paket yang dibeli.

❓ *Bagaimana cara convert file?*
Upload file → pilih tipe → bot proses → download.

❓ *Apakah data aman?*
✅ Semua file auto-delete setelah diproses.

❓ *Bagaimana join grup?*
Klik link di /bantuan untuk join grup official.`;

    const sentMsg = await bot.sendMessage(msg.chat.id, faqMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "❓ More Help", callback_data: "help_menu" },
            { text: "💎 VIP Info", callback_data: "vip_menu" }
          ],
          [
            { text: "📞 Bantuan", callback_data: "bantuan_menu" },
            { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
          ]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(msg.chat.id, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // FAQ callback
  bot.on("callback_query", async (query) => {
    if (query.data === "faq_menu") {
      const faqMsg = `📖 *FAQ - PERTANYAAN UMUM*

❓ *Apakah VIP worth?*
✅ Unlimited features, priority support, badge.

❓ *Berapa lama VIP?*
7/30/365 hari sesuai paket.

❓ *Bagaimana convert?*
Upload → pilih tipe → proses → download.

❓ *Data aman?*
✅ Auto-delete setelah diproses.

❓ *Join grup?*
Klik link di /bantuan.`;

      try {
        await bot.editMessageText(faqMsg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "❓ Help", callback_data: "help_menu" },
                { text: "🗑️ Delete", callback_data: `delete_${query.message.message_id}` }
              ]
            ]
          }
        });
      } catch (error) {}
      await bot.answerCallbackQuery(query.id);
    }
  });
}
