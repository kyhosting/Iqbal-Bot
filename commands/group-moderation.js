export default function (bot, db, saveDB) {
  const sessions = {};
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  // Command: Ban User
  bot.onText(/^\/ban$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status)) {
        return trackMessage(
          userId,
          chatId,
          `❌ Hanya admin grup yang bisa ban user`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        `❌ Error checking admin status`,
        { parse_mode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        `❌ Fitur grup hanya untuk VIP users kak!`,
        { parse_mode: "Markdown" }
      );
    }

    sessions[userId] = { step: "ban_userid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      `◆◆  BAN USER  ◆◆

┌─❖
│  👤 Reply message dari user
│  atau ketik user ID
│
│  Ketik 'batal' untuk cancel
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Command: Unban User
  bot.onText(/^\/unban$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status)) {
        return trackMessage(
          userId,
          chatId,
          `❌ Hanya admin grup yang bisa unban user`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        `❌ Error checking admin status`,
        { parse_mode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        `❌ Fitur grup hanya untuk VIP users kak!`,
        { parse_mode: "Markdown" }
      );
    }

    sessions[userId] = { step: "unban_userid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      `◆◆  UNBAN USER  ◆◆

┌─❖
│  👤 Ketik user ID yang mau di-unban
│
│  Ketik 'batal' untuk cancel
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Command: Kick User
  bot.onText(/^\/kick$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status)) {
        return trackMessage(
          userId,
          chatId,
          `❌ Hanya admin grup yang bisa kick user`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        `❌ Error checking admin status`,
        { parse_mode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        `❌ Fitur grup hanya untuk VIP users kak!`,
        { parse_mode: "Markdown" }
      );
    }

    sessions[userId] = { step: "kick_userid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      `◆◆  KICK USER  ◆◆

┌─❖
│  👤 Reply message dari user
│  atau ketik user ID
│
│  Ketik 'batal' untuk cancel
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Message handler
  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    // BAN USER
    if (session.step === "ban_userid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          `❌ Dibatalkan`,
          { parse_mode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          `❌ User ID tidak valid`,
          { parse_mode: "Markdown" }
        );
      }

      try {
        await bot.banChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          `✅ User ${targetUserId} berhasil di-ban`,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          `❌ Error ban user: ${e.message}`,
          { parse_mode: "Markdown" }
        );
      }
    }

    // UNBAN USER
    if (session.step === "unban_userid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          `❌ Dibatalkan`,
          { parse_mode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          `❌ User ID tidak valid`,
          { parse_mode: "Markdown" }
        );
      }

      try {
        await bot.unbanChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          `✅ User ${targetUserId} berhasil di-unban`,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          `❌ Error unban user: ${e.message}`,
          { parse_mode: "Markdown" }
        );
      }
    }

    // KICK USER
    if (session.step === "kick_userid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          `❌ Dibatalkan`,
          { parse_mode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          `❌ User ID tidak valid`,
          { parse_mode: "Markdown" }
        );
      }

      try {
        await bot.kickChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          `✅ User ${targetUserId} berhasil di-kick`,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          `❌ Error kick user: ${e.message}`,
          { parse_mode: "Markdown" }
        );
      }
    }
  });
}
