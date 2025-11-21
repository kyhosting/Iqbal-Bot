import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, saveDB) {
  const sessions = {};

  // EKSTRAK NOMOR - Support VCF, TXT, XLS, CSV
  bot.onText(/^⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `Kirim file untuk ekstrak nomor telepon (VCF, TXT, XLSX, CSV).`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `Kirim file untuk ekstrak nomor\ntelepon (VCF, TXT, XLSX, CSV).`, { reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/extractnomor$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `Kirim file untuk ekstrak nomor telepon (VCF, TXT, XLSX, CSV).`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `Kirim file untuk ekstrak nomor\ntelepon (VCF, TXT, XLSX, CSV).`, { reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `Proses dibatalkan.`, { reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, `Kirim file ya Kak!`, { reply_markup: bot.getMainKeyboard() });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const isCsv = fileName.endsWith(".csv");

      if (!isVcf && !isTxt && !isXls && !isCsv) {
        return bot.sendMessage(chatId, `Format file tidak didukung.`, { reply_markup: bot.getMainKeyboard() });
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

        return bot.sendMessage(chatId, `Masukkan nama file output\n(Tanpa ekstensi):`, { reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `Gagal download file.`, { reply_markup: bot.getMainKeyboard() });
      }
    }

    // Step 2: Custom filename
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `Proses dibatalkan.`, { reply_markup: bot.getMainKeyboard() });
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

        // Send info message
        await bot.sendMessage(chatId, `HASIL EKSTRAK NOMOR\n\nFile: ${session.fileName}\nTotal Nomor: ${uniqueNumbers.length}`);

        // Send file
        await bot.sendDocument(chatId, outputFile);

        // Send numbers in chunks to avoid message length limit
        const maxChunkSize = 3500; // Stay under 4096 char limit
        let currentMessage = "";
        
        for (let i = 0; i < uniqueNumbers.length; i++) {
          const number = uniqueNumbers[i] + "\n";
          
          if ((currentMessage + number).length > maxChunkSize) {
            // Send current chunk
            try {
              await bot.sendMessage(chatId, currentMessage);
            } catch (err) {
              console.error("Send message error:", err);
            }
            currentMessage = number;
            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            currentMessage += number;
          }
        }
        
        // Send remaining numbers
        if (currentMessage.trim()) {
          try {
            await bot.sendMessage(chatId, currentMessage);
          } catch (err) {
            console.error("Send message error:", err);
          }
        }

        // Send final success message
        await bot.sendMessage(chatId, `✅ Ekstrak Selesai\n\nTotal nomor: ${uniqueNumbers.length}`, { reply_markup: bot.getMainKeyboard() });
        
        bot.incrementOperation(userId);

        // Cleanup
        try { fs.unlinkSync(session.localPath); } catch {}
        try { fs.unlinkSync(outputFile); } catch {}
        delete sessions[userId];
      } catch (err) {
        console.error("Extract error:", err);
        try { fs.unlinkSync(session.localPath); } catch {}
        return bot.sendMessage(chatId, `Ekstrak gagal.`, { reply_markup: bot.getMainKeyboard() });
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
