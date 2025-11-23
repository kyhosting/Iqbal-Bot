import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

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

  function createVcfEntry(phone, name) {
    const sanitizedPhone = String(phone).replace(/\D/g, "");
    const sanitizedName = String(name).replace(/[\n\r]/g, " ");

    return `BEGIN:VCARD
VERSION:3.0
FN:${sanitizedName}
TEL:${sanitizedPhone}
END:VCARD`;
  }

  bot.onText(/^⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️$|^⛓️ XLS TO VCF ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1 };
    await trackMessage(
      userId,
      chatId,
      `◆◆  XLS TO VCF  ◆◆

┌─❖
│  📊 Upload File
│
│  Kirim file XLSX/XLS
│
│  Format: Nama | Nomor
│
│  Ketik 'batal' batalkan
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = sessions[userId];

    if (!session || session.step !== 1) return;

    try {
      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filepath = path.join(process.cwd(), `temp_${userId}_${Date.now()}.xlsx`);
      const stream = fs.createWriteStream(filepath);

      await new Promise((resolve, reject) => {
        bot.downloadFile(fileId, filepath)
          .then(() => resolve())
          .catch(reject);
      });

      const workbook = XLSX.readFile(filepath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!data || data.length === 0) {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ File tidak valid
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.file = filepath;
      session.data = data;
      session.originalName = msg.document.file_name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 2;
      await trackMessage(
        userId,
        chatId,
        `◆◆  XLS TO VCF  ◆◆

┌─❖
│  📝 Nama File
│
│  Masukkan nama file
│
│  (Tanpa ekstensi .vcf)
└─❖`,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      delete sessions[userId];
      return sendWithDelete(
        userId,
        chatId,
        `◆◆  ERROR  ◆◆

┌─❖
│  ❌ File tidak valid
└─❖`,
        { parse_mode: "HTML" }
      );
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;
    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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

      session.newFileName = /^done$/i.test(text)
        ? "contacts"
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return trackMessage(
        userId,
        chatId,
        `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Ketik 'done' untuk proses
│  Ketik 'batal' untuk batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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

      if (/^done$/i.test(text)) {
        try {
          const vcfEntries = session.data
            .map((row) => {
              if (!row[0] || !row[1]) return null;
              return createVcfEntry(String(row[1]), String(row[0]));
            })
            .filter((e) => e);

          const vcfContent = vcfEntries.join("\n\n");
          const outputPath = path.join(process.cwd(), `${session.newFileName}.vcf`);
          fs.writeFileSync(outputPath, vcfContent);

          await bot.sendDocument(chatId, outputPath, {}, {
            filename: `${session.newFileName}.vcf`,
          });

          bot.incrementOperation(userId);
          if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

          delete sessions[userId];
          return sendWithDelete(
            userId,
            chatId,
            `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File VCF dibuat
│
│  ${vcfEntries.length} kontak
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        } catch (e) {
          if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
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
    }
  });

}
