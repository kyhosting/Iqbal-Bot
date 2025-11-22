import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // GABUNG FILE - Support VCF, TXT, dan XLS
  bot.onText(/^⛓️ GABUNG FILE$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ❌ <b>Akses Ditolak</b>\n│ ➤ Fitur khusus VIP\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ 📂 <b>Gabung Multiple File</b>\n│ ➤ Support: VCF, TXT, XLSX\n│ ➤ Minimal 2 file\n│ ➤ Tipe file harus sama\n│ ➤ Ketik 'done' selesai\n│ ➤ Ketik 'batal' batalkan\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.onText(/^\/gabungfile$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ❌ <b>Akses Ditolak</b>\n│ ➤ Fitur khusus VIP\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ 📂 <b>Gabung Multiple File</b>\n│ ➤ Support: VCF, TXT, XLSX\n│ ➤ Minimal 2 file\n│ ➤ Tipe file harus sama\n│ ➤ Ketik 'done' selesai\n│ ➤ Ketik 'batal' batalkan\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses Dibatalkan</b>\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>File Kurang</b>\n│ ➤ Minimal 2 file untuk digabung\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        }
        session.step = 2;
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ 📝 <b>Nama File Output</b>\n│ ➤ Masukkan nama file hasil\n│ ➤ (Tanpa ekstensi)\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>Bukan File</b>\n│ ➤ Kirim file VCF/TXT/XLS\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>Tipe File Salah</b>\n│ ➤ Hanya VCF, TXT, XLSX\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const currentType = isVcf ? "vcf" : isTxt ? "txt" : "xls";
      if (session.fileType && session.fileType !== currentType) {
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>Tipe File Berbeda</b>\n│ ➤ Semua file harus tipe sama\n│ ➤ Sebelum: ${session.fileType.toUpperCase()}\n│ ➤ Sekarang: ${currentType.toUpperCase()}\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.fileType = currentType;

      try {
        const fileId = msg.document.file_id;
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        const buffer = await res.arrayBuffer();
        const localPath = path.join(process.cwd(), fileName);
        fs.writeFileSync(localPath, Buffer.from(buffer));

        session.files.push(localPath);
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ✅ <b>File Diterima</b>\n│ ➤ File: ${fileName}\n│ ➤ Total: ${session.files.length}\n│ ➤ Kirim lagi atau ketik 'done'\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>Download Gagal</b>\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses Dibatalkan</b>\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const outputName = text.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "gabungan";
      const ext = session.fileType === "vcf" ? ".vcf" : session.fileType === "txt" ? ".txt" : ".xlsx";
      const outputFile = path.join(process.cwd(), `${outputName}${ext}`);

      try {
        if (session.fileType === "vcf") {
          mergeVcfFiles(session.files, outputFile);
        } else if (session.fileType === "txt") {
          mergeTxtFiles(session.files, outputFile);
        } else if (session.fileType === "xls") {
          mergeXlsFiles(session.files, outputFile);
        }

        await bot.sendDocument(chatId, outputFile);
        await bot.sendMessage(chatId, `◆◆ GABUNG FILE ✅ SUKSES ◆◆\n\n╭─❖\n│ 📂 <b>Hasil Gabung</b>\n│ ➤ File: ${outputName}${ext}\n│ ➤ Total: ${session.files.length} file\n│ ➤ Tipe: ${session.fileType.toUpperCase()}\n╰───────────────❖\n\n💎 Terima kasih sudah menggunakan bot! 🙏`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Merge error:", err);
        bot.sendMessage(chatId, `◆◆ GABUNG FILE ◆◆\n\n╭─❖\n│ ⚠️ <b>Gabung Gagal</b>\n│ ➤ Ada masalah saat proses\n╰───────────────❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      for (const f of [...session.files, outputFile]) {
        try { fs.unlinkSync(f); } catch {}
      }

      delete sessions[userId];
    }
  });
}

function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data.split(/END:VCARD\s*/i).filter(Boolean).map((x) => x.trim() + "\nEND:VCARD");
}

function mergeVcfFiles(inputFiles, outputFile) {
  let allContacts = [];
  for (const file of inputFiles) {
    const contacts = readVcf(file);
    allContacts = allContacts.concat(contacts);
  }
  fs.writeFileSync(outputFile, allContacts.join("\n"));
}

function mergeTxtFiles(inputFiles, outputFile) {
  let result = "";
  for (const file of inputFiles) {
    const content = fs.readFileSync(file, "utf8");
    result += content + "\n";
  }
  fs.writeFileSync(outputFile, result);
}

function mergeXlsFiles(inputFiles, outputFile) {
  let allData = [];
  
  for (const file of inputFiles) {
    const workbook = XLSX.readFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    allData = allData.concat(data);
  }
  
  if (allData.length > 0) {
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
    XLSX.writeFile(newWorkbook, outputFile);
  }
}
