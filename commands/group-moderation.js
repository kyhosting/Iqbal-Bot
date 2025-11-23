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
    userMessages[userId] = msg.messageid;
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
          ❌ Hanya admin grup yang bisa ban user,
          { parsemode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        ❌ Error checking admin status,
        { parsemode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        ❌ Fitur grup hanya untuk VIP users kak!,
        { parsemode: "Markdown" }
      );
    }

    sessions[userId] = { step: "banuserid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      ◆◆  BAN USER  ◆◆

┌─❖
│  👤 Reply message dari user
│  atau ketik user ID
│
│  Ketik 'batal' untuk cancel
└─❖,
      { parsemode: "Markdown" }
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
          ❌ Hanya admin grup yang bisa unban user,
          { parsemode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        ❌ Error checking admin status,
        { parsemode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        ❌ Fitur grup hanya untuk VIP users kak!,
        { parsemode: "Markdown" }
      );
    }

    sessions[userId] = { step: "unbanuserid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      ◆◆  UNBAN USER  ◆◆

┌─❖
│  👤 Ketik user ID yang mau di-unban
│
│  Ketik 'batal' untuk cancel
└─❖,
      { parsemode: "Markdown" }
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
          ❌ Hanya admin grup yang bisa kick user,
          { parsemode: "Markdown" }
        );
      }
    } catch (e) {
      return trackMessage(
        userId,
        chatId,
        ❌ Error checking admin status,
        { parsemode: "Markdown" }
      );
    }

    // Check if user is VIP or Owner
    const user = db.users[userId];
    if (!user || !["owner", "vip"].includes(user.role)) {
      return trackMessage(
        userId,
        chatId,
        ❌ Fitur grup hanya untuk VIP users kak!,
        { parsemode: "Markdown" }
      );
    }

    sessions[userId] = { step: "kickuserid", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      ◆◆  KICK USER  ◆◆

┌─❖
│  👤 Reply message dari user
│  atau ketik user ID
│
│  Ketik 'batal' untuk cancel
└─❖,
      { parsemode: "Markdown" }
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
    if (session.step === "banuserid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          ❌ Dibatalkan,
          { parsemode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          ❌ User ID tidak valid,
          { parsemode: "Markdown" }
        );
      }

      try {
        await bot.banChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          ✅ User ${targetUserId} berhasil di-ban,
          { parsemode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          ❌ Error ban user: ${e.message},
          { parsemode: "Markdown" }
        );
      }
    }

    // UNBAN USER
    if (session.step === "unbanuserid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          ❌ Dibatalkan,
          { parsemode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          ❌ User ID tidak valid,
          { parsemode: "Markdown" }
        );
      }

      try {
        await bot.unbanChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          ✅ User ${targetUserId} berhasil di-unban,
          { parsemode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          ❌ Error unban user: ${e.message},
          { parsemode: "Markdown" }
        );
      }
    }

    // KICK USER
    if (session.step === "kickuserid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          ❌ Dibatalkan,
          { parsemode: "Markdown" }
        );
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return trackMessage(
          userId,
          chatId,
          ❌ User ID tidak valid,
          { parsemode: "Markdown" }
        );
      }

      try {
        await bot.kickChatMember(chatId, targetUserId);
        delete sessions[userId];
        trackMessage(
          userId,
          chatId,
          ✅ User ${targetUserId} berhasil di-kick,
          { parsemode: "Markdown" }
        );
      } catch (e) {
        trackMessage(
          userId,
          chatId,
          ❌ Error kick user: ${e.message},
          { parse_mode: "Markdown" }
        );
      }
    }
  });
}
