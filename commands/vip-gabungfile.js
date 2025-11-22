import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // GABUNG FILE - Support VCF, TXT, dan XLS
  bot.onText(/^⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n(Gabung Multiple File)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLS (Excel)\n\n▸ Kirim file yang mau digabung\n\n▸ Minimal 2 file\n▸ Semua file harus tipe sama\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/gabungfile$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n(Gabung Multiple File)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLS (Excel)\n\n▸ Kirim file yang mau digabung\n\n▸ Minimal 2 file\n▸ Semua file harus tipe sama\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ❌ Proses Dibatalkan\n\nAda yg bisa dibantu lagi?\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ File Kurang\n\nMinimal 2 file untuk digabung Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }
        session.step = 2;
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ Nama File Output\n\nMasukkan nama file hasil gabungan\n(Tanpa ekstensi)\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ Bukan File\n\nKirim file VCF, TXT, atau XLS ya Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ Tipe File Salah\n\nHanya VCF, TXT, atau XLS\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const currentType = isVcf ? "vcf" : isTxt ? "txt" : "xls";
      if (session.fileType && session.fileType !== currentType) {
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ Tipe File Berbeda\n\nSemua file harus tipe sama ya Kak\nSebelumnya: ${session.fileType.toUpperCase()}\nSekarang: ${currentType.toUpperCase()}\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ✅ File Diterima\n\nFile: ${fileName}\nTotal: ${session.files.length}\n\nKirim file lagi atau ketik 'done'\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ Gagal Download\n\nAda masalah saat download file\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        await bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ - ✅ SUKSES\n\n▸ Nama File: ${outputName}${ext}\n▸ Total File: ${session.files.length}\n▸ Tipe: ${session.fileType.toUpperCase()}\n\n💎 Terima kasih sudah menggunakan bot ini 🙏\nJangan lupa support bot dengan subscribe channel 🤗\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Merge error:", err);
        bot.sendMessage(chatId, `◆ ɢᴀʙᴜɢ ꜰɪʟᴇ\n\n▸ ⚠️ Gabung Gagal\n\nAda masalah saat gabung file\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
