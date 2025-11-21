export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  if (!db.warns) db.warns = {};
  if (!db.banned) db.banned = {};

  bot.onText(/^\/warn (\d+) (.*)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = match[1];
    const reason = match[2] || "Admin warn";

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

    const warnKey = `${chatId}_${targetId}`;
    if (!db.warns[warnKey]) {
      db.warns[warnKey] = { count: 0, warns: [] };
    }

    db.warns[warnKey].count++;
    db.warns[warnKey].warns.push({
      by: userId,
      reason,
      timestamp: new Date().toISOString()
    });

    saveDB();

    const warnCount = db.warns[warnKey].count;
    const maxWarns = 3;

    const warnMsg = `⚠️ *USER WARNED*\n\nUser: ${targetId}\nWarns: ${warnCount}/${maxWarns}\nReason: ${reason}`;

    if (warnCount >= maxWarns) {
      try {
        await bot.kickChatMember(chatId, targetId);
        const kickMsg = await bot.sendMessage(chatId,
          `🚫 *USER KICKED*\n\nUser ${targetId} kicked after ${warnCount} warns.`,
          { parse_mode: "Markdown" }
        );
        setTimeout(() => bot.deleteMessage(chatId, kickMsg.message_id).catch(() => {}), AUTO_DELETE);
      } catch (error) {}
      return;
    }

    const sentMsg = await bot.sendMessage(chatId, warnMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⚠️ More Warns", callback_data: "warns_list_cb" },
            { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
          ]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  bot.onText(/^\/ban (\d+) (.*)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = match[1];
    const reason = match[2] || "No reason";

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

    try {
      await bot.kickChatMember(chatId, targetId);

      if (!db.banned[chatId]) db.banned[chatId] = [];
      db.banned[chatId].push({
        userId: targetId,
        reason,
        bannedBy: userId,
        timestamp: new Date().toISOString()
      });
      saveDB();

      const banMsg = await bot.sendMessage(chatId, `🚫 *USER BANNED*\n\nUser: ${targetId}\nReason: ${reason}`, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📋 Banned List", callback_data: "banned_list_cb" },
              { text: "🗑️ Delete", callback_data: `delete_${banMsg.message_id}` }
            ]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, banMsg.message_id).catch(() => {}), AUTO_DELETE);
    } catch (error) {
      const errMsg = await bot.sendMessage(chatId, "❌ Could not ban user");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
    }
  });

  bot.onText(/^\/unban (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = match[1];

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

    try {
      await bot.unbanChatMember(chatId, targetId);

      if (db.banned[chatId]) {
        db.banned[chatId] = db.banned[chatId].filter(b => b.userId !== parseInt(targetId));
      }
      saveDB();

      const unbanMsg = await bot.sendMessage(chatId, `✅ *USER UNBANNED*\n\nUser: ${targetId}`, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🗑️ Delete", callback_data: `delete_${unbanMsg.message_id}` }]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, unbanMsg.message_id).catch(() => {}), AUTO_DELETE);
    } catch (error) {
      const errMsg = await bot.sendMessage(chatId, "❌ Could not unban user");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
    }
  });

  bot.onText(/^\/warns_list$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

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

    const warns = Object.entries(db.warns || {})
      .filter(([key]) => key.startsWith(`${chatId}_`))
      .slice(0, 10);

    let warnsList = `⚠️ *WARNS LIST*\n\n`;
    if (warns.length === 0) {
      warnsList = `✅ Tidak ada warns di grup ini.`;
    } else {
      warns.forEach(([key, data]) => {
        const uid = key.split("_")[1];
        warnsList += `• User ${uid}: ${data.count} warns\n`;
      });
    }

    const sentMsg = await bot.sendMessage(chatId, warnsList, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⚙️ Admin", callback_data: `admin_back_${chatId}` },
            { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
          ]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Callbacks
  bot.on("callback_query", async (query) => {
    if (query.data === "warns_list_cb") {
      await bot.answerCallbackQuery(query.id, "⏳ Loading...", true);
    }

    if (query.data === "banned_list_cb") {
      await bot.answerCallbackQuery(query.id, "⏳ Loading...", true);
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
