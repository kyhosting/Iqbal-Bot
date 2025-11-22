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

  bot.onText(/^⛓️ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ$|^\/renamefile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  RENAME FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(chatId,
      `◆◆  RENAME FILE  ◆◆

┌─❖
│  Rename File
│
│  Support: VCF, TXT, XLSX
│
│  Ubah nama file Anda
│
│  Kirim file untuk start
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

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

      if (!msg.document) {
        return bot.sendMessage(chatId,
          `◆◆  RENAME FILE  ◆◆

┌─❖
│  ⚠️ Kirim file dulu
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      const ext = path.extname(msg.document.file_name);
      session.file = localPath;
      session.ext = ext;
      session.originalName = msg.document.file_name;
      session.step = 2;

      return bot.sendMessage(chatId,
        `◆◆  RENAME FILE  ◆◆

┌─❖
│  📝 Masukkan nama baru
│
│  File: ${msg.document.file_name}
│
│  Ekstensi: ${ext}
│
│  (Tanpa ekstensi)
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const newName = text.replace(/[^a-zA-Z0-9-_]/g, "_") || "file_baru";
      const newPath = path.join(process.cwd(), `${newName}${session.ext}`);

      try {
        fs.renameSync(session.file, newPath);
        await bot.sendDocument(chatId, newPath);
        await bot.sendMessage(chatId,
          `◆◆  RENAME SUKSES  ◆◆

┌─❖
│  ✅ File berhasil direname
│
│  Nama lama: ${session.originalName}
│
│  Nama baru: ${newName}${session.ext}
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Rename error:", err);
        bot.sendMessage(chatId,
          `◆◆  RENAME FILE  ◆◆

┌─❖
│  ⚠️ Rename gagal
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } finally {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      }

      delete sessions[userId];
    }
  });
}
