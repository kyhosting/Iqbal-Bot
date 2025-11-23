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

  // Command: Set Welcome Message
  bot.onText(/^\/setwelcome$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const groupId = msg.chat.id;

    // Check if user is group admin
    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status)) {
        return trackMessage(
          userId,
          chatId,
          `❌ Hanya admin grup yang bisa set welcome message`,
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

    sessions[userId] = { step: 1, groupId };
    trackMessage(
      userId,
      chatId,
      `◆◆  SET WELCOME MESSAGE  ◆◆

┌─❖
│  👋 Masukkan welcome message
│
│  Gunakan:
│  {user} = @username
│  {name} = nama
│  {group} = nama grup
│
│  Ketik 'batal' untuk cancel
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Command: Set Rules
  bot.onText(/^\/setrules$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Check if user is group admin
    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status)) {
        return trackMessage(
          userId,
          chatId,
          `❌ Hanya admin grup yang bisa set rules`,
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

    sessions[userId] = { step: "rules", groupId: chatId };
    trackMessage(
      userId,
      chatId,
      `◆◆  SET GROUP RULES  ◆◆

┌─❖
│  📋 Masukkan rules grup
│
│  Contoh:
│  1. Tidak spam
│  2. Tidak toxsi
│  3. Jaga sopan santun
│
│  Ketik 'batal' untuk cancel
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Command: Show Rules
  bot.onText(/^\/rules$/, async (msg) => {
    const chatId = msg.chat.id;
    const groupId = chatId;

    const groupsDB = JSON.parse(require("fs").readFileSync("groups.json"));
    const groupSettings = groupsDB.groups[groupId] || {};

    if (!groupSettings.rules) {
      return bot.sendMessage(
        chatId,
        `◆◆  RULES  ◆◆

┌─❖
│  ℹ️ Belum ada rules
│
│  Admin bisa set dengan /setrules
└─❖`,
        { parse_mode: "Markdown" }
      );
    }

    bot.sendMessage(
      chatId,
      `◆◆  RULES GRUP  ◆◆

┌─❖
${groupSettings.rules}
└─❖`,
      { parse_mode: "Markdown" }
    );
  });

  // Message handler for setting welcome/rules
  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    const fs = require("fs");
    const groupsDB = JSON.parse(fs.readFileSync("groups.json"));

    // SET WELCOME MESSAGE
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          `❌ Dibatalkan`,
          { parse_mode: "Markdown" }
        );
      }

      const groupId = session.groupId;
      if (!groupsDB.groups[groupId]) {
        groupsDB.groups[groupId] = {};
      }

      groupsDB.groups[groupId].welcome = text;
      fs.writeFileSync("groups.json", JSON.stringify(groupsDB, null, 2));

      delete sessions[userId];
      trackMessage(
        userId,
        chatId,
        `✅ Welcome message berhasil diset!`,
        { parse_mode: "Markdown" }
      );
    }

    // SET RULES
    if (session.step === "rules") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(
          userId,
          chatId,
          `❌ Dibatalkan`,
          { parse_mode: "Markdown" }
        );
      }

      const groupId = session.groupId;
      if (!groupsDB.groups[groupId]) {
        groupsDB.groups[groupId] = {};
      }

      groupsDB.groups[groupId].rules = text;
      fs.writeFileSync("groups.json", JSON.stringify(groupsDB, null, 2));

      delete sessions[userId];
      trackMessage(
        userId,
        chatId,
        `✅ Rules berhasil diset!`,
        { parse_mode: "Markdown" }
      );
    }
  });
}
