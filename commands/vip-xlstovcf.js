import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /xlstovcf command
  bot.onText(/^⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ$|^\/xlstovcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ XLS TO VCF\n\n▸ ◆◆ AKSES DITOLAK ◆◆

┌─❖
├ ❌ Akses Ditolak
├ Fitur khusus VIP
└─❖\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    // Verify group membership
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ XLS TO VCF\n(Excel to Contact Converter)\n\n▸ Support Format:\n  • XLS (Excel)\n  • XLSX (Excel)\n\n▸ Kolom 1: Nama kontak\n▸ Kolom 2: Nomor telepon\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → kirim file .xls atau .xlsx
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses dibatalkan</b>\n╰───────────────❖ ya Kak 😊",
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId,
          "⚠️ <b>Kirim file Excel dulu ya Kak</b> 😊",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      const fileName = msg.document.file_name;
      const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

      if (!isExcel) {
        return bot.sendMessage(
          chatId,
          "⚠️ <b>Harus file Excel ya Kak</b> (.xls atau .xlsx) 😊",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
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
        // Baca file Excel
        const workbook = XLSX.readFile(localPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length === 0) {
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            "⚠️ <b>File Excel kosong Kak</b> 😔\n\nCoba isi dulu ya!",
            { 
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboardUser(userId)
            }
          );
        }

        // Generate VCF
        let vcfContent = "";
        let successCount = 0;
        let skipCount = 0;

        for (const row of data) {
          // Skip header atau baris kosong
          if (!row[0] || !row[1]) {
            skipCount++;
            continue;
          }

          const name = String(row[0]).trim();
          const phone = String(row[1]).trim().replace(/[^\d+]/g, "");

          if (name && phone && phone.length >= 8) {
            vcfContent += `BEGIN:VCARD\n`;
            vcfContent += `VERSION:3.0\n`;
            vcfContent += `FN:${name}\n`;
            vcfContent += `TEL;TYPE=CELL:${phone}\n`;
            vcfContent += `END:VCARD\n`;
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
            "⚠️ <b>Tidak ada data valid Kak</b> 😔\n\nPastikan format Excel:\n• Kolom 1: Nama\n• Kolom 2: Nomor",
            { 
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboardUser(userId)
            }
          );
        }

        const outputFile = fileName.replace(/\.(xls|xlsx)$/i, ".vcf");
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, vcfContent);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ <b>Konversi berhasil Kak!</b> 🎉\n\n` +
          `📊 <b>Statistik:</b>\n` +
          `• Total baris: ${data.length}\n` +
          `• Berhasil convert: ${successCount} kontak\n` +
          `• Dilewati: ${skipCount} baris\n\n` +
          `📂 <b>File VCF:</b> \`${outputFile}\`\n\n` +
          `Semoga membantu ya! 😊`,
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );

        bot.incrementOperation(userId);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) {
        console.error("Gagal convert Excel:", err);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        bot.sendMessage(
          chatId,
          "⚠️ <b>Yah… ada masalah saat convert Excel</b> 😔\n\nPastikan file Excel format yang benar ya!",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      delete sessions[userId];
    }
  });
}
