export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.on("message", async (msg) => {
    if (msg.chat.type === "private") return;

    const text = msg.text || msg.caption || "";
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    if (isVIP || isOwner) return;

    const spamPatterns = [
      /([😂🤣😅😆]{5,})/,
      /(.)\1{20,}/,
      /[A-Z]{20,}/,
      /\d{15,}/
    ];

    if (spamPatterns.some(pattern => pattern.test(text))) {
      try {
        await bot.deleteMessage(msg.chat.id, msg.message_id);
      } catch (error) {}
    }
  });

  bot.onText(/^\/clear_chat (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const count = parseInt(match[1]);

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
      return;
    }

    const statusMsg = await bot.sendMessage(chatId, `🗑️ *Clearing ${count} messages...*\n\n⏳ Loading...`, {
      parse_mode: "Markdown"
    });

    let deleted = 0;
    for (let i = msg.message_id - 1; i > msg.message_id - count - 1; i--) {
      try {
        await bot.deleteMessage(chatId, i);
        deleted++;
        if (deleted % 10 === 0) await delay(500);
      } catch (error) {}
    }

    await bot.editMessageText(
      `✅ *Clear Selesai*\n\n📊 Deleted: ${deleted} messages`,
      {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚙️ Admin", callback_data: `admin_panel` },
              { text: "🗑️ Delete", callback_data: `delete_${statusMsg.message_id}` }
            ]
          ]
        }
      }
    );

    setTimeout(() => bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Delete callback
  bot.on("callback_query", async (query) => {
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
