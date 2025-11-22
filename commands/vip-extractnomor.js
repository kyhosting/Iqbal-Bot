import fs from "fs";
import path from "path";
import XLSX from "xlsx";

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

  bot.onText(/^⛓️ ESTRAK NOMOR ⛓️$|^\/extractnomor$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  Extract Phone Numbers
│
│  Support: VCF, TXT, XLSX, CSV
│
│  Ekstrak semua nomor
│
│  Kirim file untuk start
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ⚠️ Kirim file dulu
│
│  VCF, TXT, XLSX, CSV
└─❖`, { parse_mode: "HTML" });
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const isCsv = fileName.endsWith(".csv");

      if (!isVcf && !isTxt && !isXls && !isCsv) {
        return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ⚠️ Format tidak didukung
│
│  Gunakan: VCF, TXT, XLSX, CSV
└─❖`, { parse_mode: "HTML" });
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

        return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ✅ File diterima
│
│  📝 Nama file output?
│
│  (Tanpa ekstensi)
└─❖`, { parse_mode: "HTML" });
      } catch (err) {
        console.error("Download error:", err);
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ⚠️ Download gagal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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

        await trackMessage(userId, chatId, `◆◆  EKSTRAK SUKSES  ◆◆

┌─❖
│  ✅ Nomor berhasil ekstrak
│
│  File: ${session.fileName}
│
│  Total: ${uniqueNumbers.length} nomor
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });

        await bot.sendDocument(chatId, outputFile);
        
        bot.incrementOperation(userId);

        try { fs.unlinkSync(session.localPath); } catch {}
        try { fs.unlinkSync(outputFile); } catch {}
        delete sessions[userId];
      } catch (err) {
        console.error("Extract error:", err);
        try { fs.unlinkSync(session.localPath); } catch {}
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  EKSTRAK NOMOR  ◆◆

┌─❖
│  ⚠️ Ekstrak gagal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
    if (tel && !tel.startsWith("+")) tel = "+" + tel;
    if (tel) numbers.push(tel);
  }
  return numbers;
}

function extractFromTxt(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split(/[\r\n]+/).filter(l => l.trim());
  return lines.map(line => {
    let num = line.trim();
    if (num && !num.startsWith("+")) num = "+" + num;
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
        if (str && !str.startsWith("+")) str = "+" + str;
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
      if (val && !val.startsWith("+")) val = "+" + val;
      return val;
    }).filter(v => v.length >= 10);
    numbers.push(...values);
  });
  
  return numbers;
}
