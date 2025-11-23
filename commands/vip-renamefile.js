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

  bot.onText(/^⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️$|^⛓️ RENAME FILE ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  RENAME FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    trackMessage(userId, chatId, `◆◆  RENAME FILE  ◆◆

┌─❖
│  Ganti nama file
│
│  Kirim file (VCF/TXT/XLSX)
│
│  Ketik 'batal' untuk batal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return trackMessage(userId, chatId, `⚠️ Silakan kirim file Kak`, { parse_mode: "HTML" });
      }

      try {
        const fileName = msg.document.file_name || "file";
        const fileId = msg.document.file_id;
        const filePath = await bot.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${bot.token}/${filePath.file_path}`;
        
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();

        session.step = 2;
        session.fileBuffer = buffer;
        session.originalFileName = fileName;
        
        return trackMessage(userId, chatId, `◆◆  ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`, { parse_mode: "HTML" });
      } catch (err) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `❌ Error download file: ${err.message}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    } else if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!/^done$/i.test(text)) {
        return trackMessage(userId, chatId, `◆◆  ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`, { parse_mode: "HTML" });
      }

      session.step = 3;
      return trackMessage(userId, chatId, `Nama file saat ini: \`${session.originalFileName}\`\n\nKirim nama baru (tanpa extension):\n\nContoh: \`contacts_baru\``, { parse_mode: "HTML" });
    } else if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      try {
        const newName = text.trim().replace(/[^a-zA-Z0-9_-]/g, "");
        if (!newName) {
          return trackMessage(userId, chatId, `❌ Nama file tidak valid`, { parse_mode: "HTML" });
        }

        const ext = session.originalFileName.split(".").pop();
        const newFileName = `${newName}.${ext}`;
        
        const outputPath = path.join("./temp", `${Date.now()}_${newFileName}`);
        if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });
        
        fs.writeFileSync(outputPath, Buffer.from(session.fileBuffer));

        bot.incrementOperation(userId);
        delete sessions[userId];

        await bot.sendDocument(chatId, outputPath, {
          caption: `✅ File berhasil direname!\n📄 Nama baru: \`${newFileName}\``,
          reply_markup: bot.getMainKeyboardUser(userId)
        });

        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 5000);
      } catch (err) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `❌ Error: ${err.message}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }
  });
}
