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
    userMessages[userId] = msg.messageid;
    return msg;
  }

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^⛓️ MSG TO TXT ⛓️$|^\/msgtotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        ◆◆  MSG TO TXT  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖,
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1 };
    trackMessage(
      userId,
      chatId,
      ◆◆  MSG TO TXT  ◆◆

┌─❖
│  Message to File
│
│  Kirim teks atau nomor
│
│  Simpan jadi file TXT
│
│  Ketik 'batal' batalkan
└─❖,
      { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
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
          ◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖,
          { parsemode: "Markdown" }
        );
      }

      session.content = text;
      session.step = 2;
      return bot.sendMessage(
        chatId,
        ◆◆  MSG TO TXT  ◆◆

┌─❖
│  📝 Nama File
│
│  Masukkan nama file
│
│  (Tanpa ekstensi .txt)
└─❖,
        { parsemode: "Markdown" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          ◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖,
          { parsemode: "Markdown" }
        );
      }

      const filename = text.replace(/[^a-zA-Z0-9-]/g, "") + ".txt";
      const filepath = path.join(process.cwd(), filename);

      try {
        fs.writeFileSync(filepath, session.content);

        await bot.sendDocument(chatId, filepath, {}, { filename });

        await trackMessage(
          userId,
          chatId,
          ◆◆  FILE SUKSES  ◆◆

┌─❖
│  ✅ File TXT dibuat
│
│  📄 ${filename}
└─❖,
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        delete sessions[userId];
      } catch (e) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          ◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah
└─❖,
          { parse_mode: "Markdown" }
        );
      }
    }
  });
}
