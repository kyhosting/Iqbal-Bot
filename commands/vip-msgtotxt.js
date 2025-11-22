import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};
  const userMessages = {};

  async function sendWithDelete(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  bot.onText(/^⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ$|^\/msgtotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
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
    bot.sendMessage(chatId,
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

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;

    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      session.content = text;
      session.step = 2;
      return bot.sendMessage(chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  📝 Nama File
│
│  Masukkan nama file
│
│  (Tanpa ekstensi .txt)
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const filename = text.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";
      const filepath = path.join(process.cwd(), filename);

      try {
        fs.writeFileSync(filepath, session.content);

        bot.sendDocument(chatId, filepath, {}, { filename }).then(() => {
          bot.sendMessage(chatId,
            `◆◆  FILE SUKSES  ◆◆

┌─❖
│  ✅ File TXT dibuat
│
│  File: ${filename}
│
│  Terima kasih! 😊
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
          bot.incrementOperation(userId);
          fs.unlinkSync(filepath);
        }).catch((err) => {
          console.error("Gagal kirim file:", err);
          bot.sendMessage(chatId,
            `◆◆  MSG TO TXT  ◆◆

┌─❖
│  ⚠️ Gagal kirim file
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
          try { fs.unlinkSync(filepath); } catch {}
        });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId,
          `◆◆  MSG TO TXT  ◆◆

┌─❖
│  ⚠️ Gagal buat file
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      delete sessions[userId];
    }
  });
}
