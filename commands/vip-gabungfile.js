import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ GABUNG FILE$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, 
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>❖ GABUNG FILE</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `<code>✦ ❌ Akses Ditolak</code>\n` +
        `<code>✦ Fitur khusus VIP</code>\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, 
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
      `<b>❖ GABUNG FILE</b>\n` +
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
      `<code>▶ 📂 Gabung Multiple File</code>\n` +
      `<code>▶ Support: VCF, TXT, XLSX</code>\n` +
      `<code>▶ Minimal 2 file</code>\n` +
      `<code>▶ Tipe file harus sama</code>\n` +
      `<code>▶ Ketik 'done' selesai</code>\n` +
      `<code>▶ Ketik 'batal' batalkan</code>\n\n` +
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.onText(/^\/gabungfile$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, 
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
        `<b>❖ GABUNG FILE</b>\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
        `<code>✦ ❌ Akses Ditolak</code>\n` +
        `<code>✦ Fitur khusus VIP</code>\n\n` +
        `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, 
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
      `<b>❖ GABUNG FILE</b>\n` +
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
      `<code>▶ 📂 Gabung Multiple File</code>\n` +
      `<code>▶ Support: VCF, TXT, XLSX</code>\n` +
      `<code>▶ Minimal 2 file</code>\n` +
      `<code>▶ Tipe file harus sama</code>\n` +
      `<code>▶ Ketik 'done' selesai</code>\n` +
      `<code>▶ Ketik 'batal' batalkan</code>\n\n` +
      `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
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
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ DIBATALKAN</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>✦ ❌ Proses Dibatalkan</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, 
            `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
            `<b>❖ GABUNG FILE</b>\n` +
            `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
            `<code>▶ ⚠️ File Kurang</code>\n` +
            `<code>▶ Minimal 2 file untuk digabung</code>\n\n` +
            `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }
        session.step = 2;
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ 📝 Nama File Output</code>\n` +
          `<code>▶ Masukkan nama file hasil</code>\n` +
          `<code>▶ (Tanpa ekstensi)</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ⚠️ Bukan File</code>\n` +
          `<code>▶ Kirim file VCF/TXT/XLS</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ⚠️ Tipe File Salah</code>\n` +
          `<code>▶ Hanya VCF, TXT, XLSX</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const currentType = isVcf ? "vcf" : isTxt ? "txt" : "xls";
      if (session.fileType && session.fileType !== currentType) {
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ⚠️ Tipe File Berbeda</code>\n` +
          `<code>▶ Semua file harus tipe sama</code>\n` +
          `<code>▶ Sebelum: <b>${session.fileType.toUpperCase()}</b></code>\n` +
          `<code>▶ Sekarang: <b>${currentType.toUpperCase()}</b></code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
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
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ✅ File Diterima</code>\n` +
          `<code>▶ File: ${fileName}</code>\n` +
          `<code>▶ Total: ${session.files.length}</code>\n` +
          `<code>▶ Kirim lagi atau ketik 'done'</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ⚠️ Download Gagal</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ DIBATALKAN</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>✦ ❌ Proses Dibatalkan</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
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
        await bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE ✅ SUKSES</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ 📂 Hasil Gabung</code>\n` +
          `<code>▶ File: ${outputName}${ext}</code>\n` +
          `<code>▶ Total: ${session.files.length} file</code>\n` +
          `<code>▶ Tipe: ${session.fileType.toUpperCase()}</code>\n` +
          `<code>▶ 💎 Terima kasih sudah pakai bot!</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
        
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Merge error:", err);
        bot.sendMessage(chatId, 
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
          `<b>❖ GABUNG FILE</b>\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
          `<code>▶ ⚠️ Gabung Gagal</code>\n\n` +
          `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
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
