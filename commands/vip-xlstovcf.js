import fs from "fs";
import path from "path";
import XLSX from "xlsx";

function createVcfEntry(phone, name) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:+${phone.replace(/\D/g, "")}`,
    "END:VCARD",
  ].join("\n");
}

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

  bot.onText(/^⛓️ XLS TO VCF ⛓️$|^\/xlstovcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await trackMessage(
      userId,
      chatId,
      `◆◆  XLS TO VCF  ◆◆

┌─❖
│  Excel to Contact Converter
│
│  Support: XLS, XLSX
│
│  Kolom 1: Nama kontak
│
│  Kolom 2: Nomor telepon
│
│  Kirim file Excel
│
│  Ketik 'done' selesai
│  Ketik 'batal' batalkan
└─❖`,
      { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
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
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "Markdown" }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ Kirim file Excel
│
│  Support: XLS atau XLSX
└─❖`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.file_name;
      const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

      if (!isExcel) {
        return bot.sendMessage(
          chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ Hanya XLS atau XLSX
└─❖`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), fileName);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      try {
        const workbook = XLSX.readFile(localPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length === 0) {
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ File Excel kosong
│
│  Isi dulu ya!
└─❖`,
            { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }

        session.file = localPath;
        session.data = data;
        session.step = 2;

        return bot.sendMessage(
          chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Masukkan nama file
│
│  (Tanpa ekstensi)
└─❖`,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ File tidak valid
└─❖`,
          { parse_mode: "Markdown" }
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
          { parse_mode: "Markdown" }
        );
      }

      const fileName = /^done$/i.test(text)
        ? "contacts"
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      try {
        const vcfEntries = session.data
          .map((row) => {
            if (!row[0] || !row[1]) return null;
            return createVcfEntry(String(row[1]), String(row[0]));
          })
          .filter((e) => e);

        const vcfContent = vcfEntries.join("\n\n");
        const outputPath = path.join(process.cwd(), `${fileName}.vcf`);
        fs.writeFileSync(outputPath, vcfContent);

        await bot.sendDocument(chatId, outputPath, {}, {
          filename: `${fileName}.vcf`,
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
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
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
          { parse_mode: "Markdown" }
        );
      }
    }
  });
}
