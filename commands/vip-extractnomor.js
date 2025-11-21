import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // EKSTRAK NOMOR - Support VCF, TXT, dan XLS
  bot.onText(/^⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n(Extract Phone Number)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLS (Excel)\n\n▸ Kirim file untuk ekstrak nomor\n\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/extractnomor$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n(Extract Phone Number)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLS (Excel)\n\n▸ Kirim file untuk ekstrak nomor\n\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ❌ Proses Dibatalkan\n\nAda yg bisa dibantu lagi?\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ⚠️ Bukan File\n\nKirim file VCF, TXT, atau XLS ya Kak\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ⚠️ Tipe File Salah\n\nHanya VCF, TXT, atau XLS\n\n◆`, { reply_markup: bot.getMainKeyboard() });
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
        session.fileType = isVcf ? "vcf" : isTxt ? "txt" : "xls";

        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ✅ File Diterima\n\n▸ Masukkan nama file output\n(Tanpa ekstensi .txt)\n\nContoh: nomor_hasil\n\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ⚠️ Gagal Download\n\nAda masalah saat download file\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }
    }

    // Step 2: Custom filename
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
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
        }

        const uniqueNumbers = [...new Set(numbers)].sort();
        fs.writeFileSync(outputFile, uniqueNumbers.join("\n"));

        await bot.sendDocument(chatId, outputFile);
        await bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ - ✅ SUKSES\n\n▸ Total Nomor: ${uniqueNumbers.length}\n▸ Nama File: ${outputName}.txt\n▸ Tipe: ${session.fileType.toUpperCase()}\n\n💎 Terima kasih sudah menggunakan bot ini 🙏\nJangan lupa support bot dengan subscribe channel 🤗\n\n◆`, { reply_markup: bot.getMainKeyboard() });
        
        bot.incrementOperation(userId);

        // Cleanup
        try { fs.unlinkSync(session.localPath); } catch {}
        try { fs.unlinkSync(outputFile); } catch {}
        delete sessions[userId];
      } catch (err) {
        console.error("Extract error:", err);
        try { fs.unlinkSync(session.localPath); } catch {}
        return bot.sendMessage(chatId, `◆ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ\n\n▸ ⚠️ Ekstrak Gagal\n\nAda masalah saat ekstrak nomor\n\n◆`, { reply_markup: bot.getMainKeyboard() });
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
    const tel = match[1].replace(/[^0-9+]/g, "");
    if (tel) numbers.push(tel);
  }
  return numbers;
}

function extractFromTxt(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const phoneRegex = /(\+?[0-9\-\s()]{9,})/g;
  const matches = data.match(phoneRegex) || [];
  return matches.map(num => num.replace(/[^0-9+]/g, "")).filter(num => num.length >= 9);
}

function extractFromXls(filePath) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  const numbers = [];
  const phoneRegex = /(\+?[0-9\-\s()]{9,})/g;
  
  data.forEach(row => {
    Object.values(row).forEach(cell => {
      if (cell) {
        const matches = String(cell).match(phoneRegex) || [];
        matches.forEach(num => {
          const clean = num.replace(/[^0-9+]/g, "");
          if (clean.length >= 9) numbers.push(clean);
        });
      }
    });
  });
  
  return numbers;
}
