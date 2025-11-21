export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/admin_panel$|^⚙️ ADMIN PANEL$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (msg.chat.type === "private") {
      const errMsg = await bot.sendMessage(chatId, "❌ Hanya di grup!");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
      return;
    }

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        const errMsg = await bot.sendMessage(chatId, "❌ Hanya admin!");
        setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
        return;
      }
    } catch (error) {
      const errMsg = await bot.sendMessage(chatId, "❌ Error");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
      return;
    }

    const panelMsg = `⚙️ *ADMIN PANEL*

Grup: ${msg.chat.title}

📋 *Admin Controls:*
🔧 Settings
🚫 Ban/Kick User
⚠️ Warn System
📋 VIP List
🗑️ Clear Chat
📢 Broadcast`;

    const sentMsg = await bot.sendMessage(chatId, panelMsg, {
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
          [
            { text: "📢 Broadcast", callback_data: `admin_broadcast_${chatId}` },
            { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
          ]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Admin callbacks
  bot.on("callback_query", async (query) => {
    const data = query.data;

    if (data.startsWith("admin_settings_")) {
      const settingsMsg = `🔧 *SETTINGS GRUP*

Features:
✅ Welcome Message
✅ Anti-Spam
✅ VIP Badge
✅ Auto-Delete
✅ File Tracking

_Toggle features coming soon_`;

      try {
        await bot.editMessageText(settingsMsg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Back", callback_data: `admin_back_${query.message.chat.id}` }],
              [{ text: "🗑️ Delete", callback_data: `delete_${query.message.message_id}` }]
            ]
          }
        });
      } catch (error) {}
      await bot.answerCallbackQuery(query.id, "✅ Settings", true);
    }

    if (data.startsWith("admin_ban_")) {
      await bot.answerCallbackQuery(query.id, "⏳ Reply to message untuk ban", true);
    }

    if (data.startsWith("admin_warn_")) {
      await bot.answerCallbackQuery(query.id, "⏳ Warning system loading...", true);
    }

    if (data.startsWith("admin_vip_")) {
      const users = db.users || {};
      const vipList = Object.entries(users)
        .filter(([_, u]) => u.role === "vip" && u.vip_expired > Date.now())
        .slice(0, 10);

      let vipMsg = `📋 *VIP MEMBERS* (${vipList.length})\n\n`;
      if (vipList.length === 0) {
        vipMsg = `_Belum ada VIP member._`;
      } else {
        vipList.forEach(([id, user]) => {
          const days = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
          vipMsg += `• @${user.username || user.first_name} - ${days}d left\n`;
        });
      }

      try {
        await bot.editMessageText(vipMsg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Back", callback_data: `admin_back_${query.message.chat.id}` }],
              [{ text: "🗑️ Delete", callback_data: `delete_${query.message.message_id}` }]
            ]
          }
        });
      } catch (error) {}
      await bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("admin_clear_")) {
      await bot.answerCallbackQuery(query.id, "⏳ Clear loading...", true);
    }

    if (data.startsWith("admin_back_")) {
      const chatId = parseInt(data.split("_")[2]);
      const panelMsg = `⚙️ *ADMIN PANEL*\n\nGrup: Admin Panel\n\n📋 *Controls available*`;

      try {
        await bot.editMessageText(panelMsg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔧 Settings", callback_data: `admin_settings_${chatId}` }],
              [
                { text: "🚫 Ban", callback_data: `admin_ban_${chatId}` },
                { text: "⚠️ Warn", callback_data: `admin_warn_${chatId}` }
              ],
              [
                { text: "📋 VIP List", callback_data: `admin_vip_${chatId}` },
                { text: "🗑️ Delete", callback_data: `delete_${query.message.message_id}` }
              ]
            ]
          }
        });
      } catch (error) {}
      await bot.answerCallbackQuery(query.id);
    }

    if (query.data.startsWith("delete_")) {
      const msgId = parseInt(query.data.split("_")[1]);
      try {
        await bot.deleteMessage(query.message.chat.id, msgId);
        await bot.answerCallbackQuery(query.id, "✅ Deleted", true);
      } catch (error) {
        await bot.answerCallbackQuery(query.id, "❌ Error", false);
      }
    }
  });
}
