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
      return bot.sendMessage(
        chatId,
        `◆ XLS TO VCF\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ XLS TO VCF\n(Excel to Contact Converter)\n\n▸ Support Format:\n  • XLS (Excel)\n  • XLSX (Excel)\n\n▸ Kolom 1: Nama kontak\n▸ Kolom 2: Nomor telepon\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
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
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId,
          "⚠️ *Kirim file Excel dulu ya Kak* 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      const fileName = msg.document.file_name;
      const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

      if (!isExcel) {
        return bot.sendMessage(
          chatId,
          "⚠️ *Harus file Excel ya Kak* (.xls atau .xlsx) 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
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
            "⚠️ *File Excel kosong Kak* 😔\n\nCoba isi dulu ya!",
            { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
          );
        }

        let vcfContent = "";
        let successCount = 0;
        let skipCount = 0;

        for (const row of data) {
          if (!row[0] || !row[1]) {
            skipCount++;
            continue;
          }

          const name = String(row[0]).trim();
          const phone = String(row[1]).trim().replace(/[^\d+]/g, "");

          if (name && phone && phone.length >= 8) {
            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${phone}\nEND:VCARD\n`;
            successCount++;
          } else {
            skipCount++;
          }
        }

        if (successCount === 0) {
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            "⚠️ *Tidak ada data valid Kak* 😔\n\nPastikan format Excel:\n• Kolom 1: Nama\n• Kolom 2: Nomor",
            { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
          );
        }

        const outputFile = fileName.replace(/\.(xls|xlsx)$/i, ".vcf");
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, vcfContent);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ *Konversi berhasil Kak!* 🎉\n\n📊 *Statistik:*\n• Total baris: ${data.length}\n• Berhasil convert: ${successCount} kontak\n• Dilewati: ${skipCount} baris\n\n📂 *File VCF:* \`${outputFile}\`\n\nSemoga membantu ya! 😊`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );

        bot.incrementOperation(userId);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) {
        console.error("Gagal convert Excel:", err);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        bot.sendMessage(
          chatId,
          "⚠️ *Yah… ada masalah saat convert Excel* 😔\n\nPastikan file Excel format yang benar ya!",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      delete sessions[userId];
    }
  });
}
