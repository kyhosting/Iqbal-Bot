import fs from "fs";
import path from "path";

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

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️$|^⛓️ MSG TO TXT ⛓️$|^\/msgtotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1 };
    trackMessage(
      userId,
      chatId,
      `◆◆  MSG TO TXT  ◆◆

┌─❖
│  Message to File
│
│  Kirim teks atau nomor
│
│  Simpan jadi file TXT
│
│  Ketik 'batal' batalkan
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;

    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.content = text;
      session.step = 2;
      return bot.sendMessage(
        chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  📝 Nama File
│
│  Masukkan nama file
│
│  (Tanpa ekstensi .txt)
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.filename = text.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";
      session.step = 3;
      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Done", callback_data: `msgtotxt_done_${userId}` },
            { text: "❌ Batal", callback_data: `msgtotxt_batal_${userId}` }
          ]
        ]
      };
      return bot.sendMessage(
        chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`,
        { parse_mode: "HTML", reply_markup: keyboard }
      );
    }
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;
    const session = sessions[userId];

    if (data === `msgtotxt_done_${userId}`) {
      await bot.answerCallbackQuery(query.id);
      if (!session || session.step !== 3) return;

      const filepath = path.join(process.cwd(), session.filename);
      try {
        fs.writeFileSync(filepath, session.content);
        await bot.sendDocument(chatId, filepath, {}, { filename: session.filename });

        await trackMessage(
          userId,
          chatId,
          `◆◆  FILE SUKSES  ◆◆

┌─❖
│  ✅ File TXT dibuat
│
│  📄 ${session.filename}
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        delete sessions[userId];
      } catch (e) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah
└─❖`,
          { parse_mode: "HTML" }
        );
      }
    }

    if (data === `msgtotxt_batal_${userId}`) {
      await bot.answerCallbackQuery(query.id);
      if (!session || session.step !== 3) return;
      delete sessions[userId];
      return sendWithDelete(
        userId,
        chatId,
        `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }
  });
}
