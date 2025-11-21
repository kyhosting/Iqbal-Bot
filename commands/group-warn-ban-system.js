export default function (bot, db, saveDB) {
  // Initialize warn DB
  if (!db.warns) db.warns = {};
  if (!db.banned) db.banned = {};

  // Warn command
  bot.onText(/^\/warn (@\w+|\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetStr = match[1];

    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya di grup!");
    }

    // Check admin
    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin");
      }
    } catch (error) {
      return bot.sendMessage(chatId, "❌ Error check admin");
    }

    // Parse target user
    let targetId = targetStr;
    if (targetStr.startsWith("@")) {
      // Convert username to ID (simplified - in production gunakan API)
      return bot.sendMessage(chatId, "📝 Fitur warn by username - Coming soon, gunakan user ID");
    }

    const warnKey = `${chatId}_${targetId}`;
    if (!db.warns[warnKey]) {
      db.warns[warnKey] = { count: 0, warns: [] };
    }

    db.warns[warnKey].count++;
    db.warns[warnKey].warns.push({
      by: userId,
      reason: "Admin warn",
      timestamp: new Date().toISOString()
    });

    saveDB();

    const warnCount = db.warns[warnKey].count;
    const maxWarns = 3;

    const warnMsg = `⚠️ *USER WARNED*\n\n`;
    `User ID: ${targetId}\n`;
    `Warns: ${warnCount}/${maxWarns}\n\n`;

    if (warnCount >= maxWarns) {
      bot.kickChatMember(chatId, targetId).catch(() => {});
      return bot.sendMessage(chatId, 
        `⚠️ *USER KICKED*\n\nUser ${targetId} kicked after ${warnCount} warns.`, 
        { parse_mode: "Markdown" }
      );
    }

    bot.sendMessage(chatId, warnMsg, { parse_mode: "Markdown" });
  });

  // Ban command
  bot.onText(/^\/ban (\d+) (.*)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = match[1];
    const reason = match[2] || "No reason";

    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya di grup!");
    }

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin");
      }
    } catch (error) {
      return bot.sendMessage(chatId, "❌ Error check admin");
    }

    // Ban user
    try {
      await bot.kickChatMember(chatId, targetId);

      // Store ban info
      if (!db.banned[chatId]) db.banned[chatId] = [];
      db.banned[chatId].push({
        userId: targetId,
        reason,
        bannedBy: userId,
        timestamp: new Date().toISOString()
      });
      saveDB();

      bot.sendMessage(chatId, `🚫 *USER BANNED*\n\nUser: ${targetId}\nReason: ${reason}`, 
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      bot.sendMessage(chatId, "❌ Could not ban user");
    }
  });

  // Unban command
  bot.onText(/^\/unban (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = match[1];

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin");
      }
    } catch (error) {
      return bot.sendMessage(chatId, "❌ Error check admin");
    }

    try {
      await bot.unbanChatMember(chatId, targetId);

      // Remove from banned list
      if (db.banned[chatId]) {
        db.banned[chatId] = db.banned[chatId].filter(b => b.userId !== parseInt(targetId));
      }
      saveDB();

      bot.sendMessage(chatId, `✅ *USER UNBANNED*\n\nUser: ${targetId}`, 
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      bot.sendMessage(chatId, "❌ Could not unban user");
    }
  });

  // List warns
  bot.onText(/^\/warns_list$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin");
      }
    } catch (error) {
      return;
    }

    const warns = Object.entries(db.warns || {})
      .filter(([key]) => key.startsWith(`${chatId}_`))
      .slice(0, 10);

    let warnsList = `⚠️ *WARNS LIST*\n\n`;
    warns.forEach(([key, data]) => {
      const uid = key.split("_")[1];
      warnsList += `User ${uid}: ${data.count} warns\n`;
    });

    if (warns.length === 0) {
      warnsList = `✅ Tidak ada user dengan warns di grup ini.`;
    }

    bot.sendMessage(chatId, warnsList, { parse_mode: "Markdown" });
  });
}
