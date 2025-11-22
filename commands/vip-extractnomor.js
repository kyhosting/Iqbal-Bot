import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // EKSTRAK NOMOR - Support VCF, TXT, XLS, CSV
  bot.onText(/^⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ$|^\/extractnomor$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ EKSTRAK NOMOR\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ EKSTRAK NOMOR\n(Extract Phone Numbers)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLSX (Excel)\n  • CSV (Spreadsheet)\n\n▸ Ekstrak semua nomor telepon\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];
    if (!session) return;

    // Step 1: Upload file
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Proses Dibatalkan</b>\n\nExtrak nomor dibatalkan. Klik menu untuk memulai ulang.`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, `📤 <b>Kirim File Dulu Kak!</b>\n\nFormula yang didukung:\n• VCF\n• TXT\n• XLSX\n• CSV\n\n_Ketik "batal" untuk membatalkan._`, { parse_mode: "HTML" });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const isCsv = fileName.endsWith(".csv");

      if (!isVcf && !isTxt && !isXls && !isCsv) {
        return bot.sendMessage(chatId, `❌ <b>Format Tidak Didukung</b>\n\nGunakan: VCF, TXT, XLSX, atau CSV.\n\n_Ketik "batal" untuk membatalkan._`, { parse_mode: "HTML" });
      }

      try {
        const fileId = msg.document.file_id;
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        const buffer = await res.arrayBuffer();
        const localPath = path.join(process.cwd(), fileName);
        fs.writeFileSync(localPath, Buffer.from(buffer));

        session.step = 2;
        session.localPath = localPath;
        session.fileName = fileName;
        session.fileType = isVcf ? "vcf" : isTxt ? "txt" : isCsv ? "csv" : "xls";

        return bot.sendMessage(chatId, `✅ <b>File Berhasil Diupload</b>\n\nSekarang, masukkan nama file output\n(Tanpa ekstensi):\n\n_Ketik "batal" untuk membatalkan._`, { parse_mode: "HTML" });
      } catch (err) {
        console.error("Download error:", err);
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Gagal Download File</b>\n\nCoba ulangi atau hubungi owner.\n\n_Ketik "batal" untuk membatalkan._`, { parse_mode: "HTML" });
      }
    }

    // Step 2: Custom filename
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Proses Dibatalkan</b>\n\nExtrak nomor dibatalkan. Klik menu untuk memulai ulang.`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const outputName = text.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "nomor_hasil";
      const outputFile = path.join(process.cwd(), `${outputName}.txt`);

      try {
        let numbers = [];
        
        if (session.fileType === "vcf") {
          numbers = extractFromVcf(session.localPath);
        } else if (session.fileType === "txt") {
          numbers = extractFromTxt(session.localPath);
        } else if (session.fileType === "xls") {
          numbers = extractFromXls(session.localPath);
        } else if (session.fileType === "csv") {
          numbers = extractFromCsv(session.localPath);
        }

        const uniqueNumbers = [...new Set(numbers)].sort();
        fs.writeFileSync(outputFile, uniqueNumbers.join("\n"));

        // Send ONE message with info + file + single success message
        await bot.sendMessage(chatId, `✅ <b>EKSTRAK NOMOR SELESAI!</b>\n\n📄 File: \`${session.fileName}\`\n📊 Total Nomor: <b>${uniqueNumbers.length}</b>\n\n📝 Nomor-nomor Anda sudah di-extract dan disimpan ke file. Download file di bawah ini.\n\nSemoga membantu ya Kak! 😊`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });

        // Send file
        await bot.sendDocument(chatId, outputFile);
        
        bot.incrementOperation(userId);

        // Cleanup
        try { fs.unlinkSync(session.localPath); } catch {}
        try { fs.unlinkSync(outputFile); } catch {}
        delete sessions[userId];
      } catch (err) {
        console.error("Extract error:", err);
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Ekstrak Gagal</b>\n\nAda kesalahan saat memproses file.\nCoba ulangi atau hubungi owner.`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }
  });
}

function extractFromVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const numbers = [];
  const phoneRegex = /TEL(?::[^:]*)?:([^\r\n]+)/gi;
  let match;
  while ((match = phoneRegex.exec(data)) !== null) {
    let tel = match[1].replace(/[^0-9+]/g, "");
    if (tel && !tel.startsWith("+")) {
      tel = "+" + tel;
    }
    if (tel) numbers.push(tel);
  }
  return numbers;
}

function extractFromTxt(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split(/[\r\n]+/).filter(l => l.trim());
  return lines.map(line => {
    let num = line.trim();
    if (num && !num.startsWith("+")) {
      num = "+" + num;
    }
    return num;
  }).filter(line => line.length >= 10);
}

function extractFromXls(filePath) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  const numbers = [];
  
  data.forEach(row => {
    Object.values(row).forEach(cell => {
      if (cell) {
        let str = String(cell).trim();
        if (str && !str.startsWith("+")) {
          str = "+" + str;
        }
        if (str.length >= 10) numbers.push(str);
      }
    });
  });
  
  return numbers;
}

function extractFromCsv(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split(/[\r\n]+/).filter(l => l.trim());
  const numbers = [];
  
  lines.forEach(line => {
    const values = line.split(",").map(v => {
      let val = v.trim();
      if (val && !val.startsWith("+")) {
        val = "+" + val;
      }
      return val;
    }).filter(v => v.length >= 10);
    numbers.push(...values);
  });
  
  return numbers;
}
