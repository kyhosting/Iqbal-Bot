export default function (bot, db, saveDB) {
  bot.onText(/^\/admin_panel$|^⚙️ ADMIN PANEL$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Only in groups
    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya di grup!");
    }

    // Check admin
    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin yang bisa buka panel ini.");
      }
    } catch (error) {
      return bot.sendMessage(chatId, "❌ Error check admin status");
    }

    const panelMsg = `⚙️ *ADMIN PANEL*

Grup: ${msg.chat.title}

📋 *Admin Controls:*
🔧 Settings - Atur fitur grup
🚫 Ban/Kick User - Manage member
⚠️ Warn System - Beri peringatan
📋 VIP List - Lihat member VIP
🗑️ Clear Chat - Hapus pesan
📢 Broadcast - Kirim pengumuman`;

    bot.sendMessage(chatId, panelMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔧 Settings", callback_data: `admin_settings_${chatId}` }],
          [
            { text: "🚫 Ban User", callback_data: `admin_ban_${chatId}` },
            { text: "⚠️ Warn User", callback_data: `admin_warn_${chatId}` }
          ],
          [
            { text: "📋 VIP List", callback_data: `admin_vip_${chatId}` },
            { text: "🗑️ Clear Chat", callback_data: `admin_clear_${chatId}` }
          ],
          [{ text: "📢 Broadcast", callback_data: `admin_broadcast_${chatId}` }]
        ]
      }
    });
  });

  // Admin callbacks
  bot.on("callback_query", async (query) => {
    const data = query.data;

    if (data.startsWith("admin_settings_")) {
      const chatId = parseInt(data.split("_")[2]);
      const settingsMsg = `🔧 *SETTINGS GRUP*

Fitur yang dapat di-toggle:
✅ Welcome Message
✅ Anti-Spam Auto-Delete
✅ VIP Badge Display
✅ Auto-Clear Chat
✅ Lapor Admin Feature

_Soon: Detailed settings panel_`;

      bot.editMessageText(settingsMsg, {
        chat_id: query.from.id,
        message_id: query.message.message_id,
        parse_mode: "Markdown"
      }).catch(() => {});
    }

    if (data.startsWith("admin_ban_")) {
      bot.answerCallbackQuery(query.id, "❌ Reply to user message untuk ban. (Coming soon UI)", false);
    }

    if (data.startsWith("admin_warn_")) {
      bot.answerCallbackQuery(query.id, "⚠️ Warning system - Coming soon", false);
    }

    if (data.startsWith("admin_vip_")) {
      bot.answerCallbackQuery(query.id, "📋 VIP List - Coming soon", false);
    }

    if (data.startsWith("admin_clear_")) {
      bot.answerCallbackQuery(query.id, "🗑️ Clear Chat - Coming soon", false);
    }
  });
}
