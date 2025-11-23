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

  bot.onText(/^⛓️ VCF TO TXT ⛓️$|^\/vcftotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        ◆◆  VCF TO TXT  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖,
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await trackMessage(
      userId,
      chatId,
      ◆◆  VCF TO TXT  ◆◆

┌─❖
│  Convert VCF ke TXT
│
│  Support: VCF
│
│  Ekstrak nomor dari kontak
│
│  Kirim file untuk start
│
│  Ketik 'done' selesai
│  Ketik 'batal' batalkan
└─❖,
      { parsemode: "Markdown" }
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

      if (!msg.document || !msg.document.filename.endsWith(".vcf")) {
        return bot.sendMessage(
          chatId,
          ◆◆  VCF TO TXT  ◆◆

┌─❖
│  ⚠️ Kirim file .vcf
└─❖,
          { parsemode: "Markdown" }
        );
      }

      const fileId = msg.document.fileid;
      const file = await bot.getFile(fileId);
      const filePath = https://api.telegram.org/file/bot${bot.token}/${file.filepath};
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.filename);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.filename.replace(".vcf", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        ◆◆  VCF TO TXT  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Masukkan nama file
│
│  (Tanpa ekstensi)
└─❖,
        { parsemode: "Markdown" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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

      const outputName = /^done$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-]/g, "");

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const matches = content.match(/TEL;[^:]:(\+?\d+)/g) || [];
        const numbers = matches.map((m) => m.replace(/.:/, ""));

        if (numbers.length === 0) {
          if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            ◆◆  VCF TO TXT  ◆◆

┌─❖
│  ⚠️ Tidak ada nomor ditemukan
└─❖,
            { parsemode: "Markdown" }
          );
        }

        const outputPath = path.join(process.cwd(), ${outputName}.txt);
        fs.writeFileSync(outputPath, numbers.join("\n"));

        await bot.sendDocument(chatId, outputPath, {}, {
          filename: ${outputName}.txt,
        });

        bot.incrementOperation(userId);
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          ◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File TXT dibuat
│
│  ${numbers.length} nomor
└─❖,
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      } catch (e) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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
