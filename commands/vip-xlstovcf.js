import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ$|^\/xlstovcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  XLS TO VCF  ◆◆

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
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ Kirim file Excel
│
│  Support: XLS atau XLSX
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.file_name;
      const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

      if (!isExcel) {
        return bot.sendMessage(chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ Hanya XLS atau XLSX
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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
          return bot.sendMessage(chatId,
            `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ File Excel kosong
│
│  Isi dulu ya!
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }

        const vcf = data.map((row, idx) => {
          const name = row[0] || `Contact${idx}`;
          const phone = row[1] || "";
          return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nN:${name};;;;\nTEL;TYPE=CELL:${phone}\nEND:VCARD`;
        }).join("\n");

        const outputPath = path.join(process.cwd(), "contacts.vcf");
        fs.writeFileSync(outputPath, vcf);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(chatId,
          `◆◆  KONVERSI SUKSES  ◆◆

┌─❖
│  ✅ XLS to VCF berhasil
│
│  Total kontak: ${data.length}
│
│  File: contacts.vcf
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);

        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (err) {
        console.error("Convert error:", err);
        bot.sendMessage(chatId,
          `◆◆  XLS TO VCF  ◆◆

┌─❖
│  ⚠️ Konversi gagal
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } finally {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }

      delete sessions[userId];
    }
  });
}
