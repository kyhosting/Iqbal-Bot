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
    userMessages[userId] = msg.messageid;
    return msg;
  }

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^⛓️ GABUNG FILE ⛓️$|^\/gabungfile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, 
        ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖, 
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    trackMessage(userId, chatId, 
      ◆◆  GABUNG FILE  ◆◆

┌─❖
│  📂 Gabung Multiple File
│
│  Support: VCF, TXT, XLSX
│
│  Minimal 2 file
│
│  Tipe file harus sama
│
│  Ketik 'done' selesai
│
│  Ketik 'batal' batalkan
└─❖, 
      { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
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
        ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖, 
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    trackMessage(userId, chatId, 
      ◆◆  GABUNG FILE  ◆◆

┌─❖
│  📂 Gabung Multiple File
│
│  Support: VCF, TXT, XLSX
│
│  Minimal 2 file
│
│  Tipe file harus sama
│
│  Ketik 'done' selesai
│
│  Ketik 'batal' batalkan
└─❖, 
      { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
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
        return sendWithDelete(userId, chatId, 
          ◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses Dibatalkan
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, 
            ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ File Kurang
│
│  Minimal 2 file untuk digabung
└─❖, 
            { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
          );
        }
        session.step = 2;
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Masukkan nama file hasil
│
│  (Tanpa ekstensi)
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Bukan File
│
│  Kirim file VCF/TXT/XLS
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.filename || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Tipe File Salah
│
│  Hanya VCF, TXT, XLSX
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      const currentType = isVcf ? "vcf" : isTxt ? "txt" : "xls";
      if (session.fileType && session.fileType !== currentType) {
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Tipe File Berbeda
│
│  Semua file harus tipe sama
│
│  Sebelum: ${session.fileType.toUpperCase()}
│
│  Sekarang: ${currentType.toUpperCase()}
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      session.fileType = currentType;

      try {
        const fileId = msg.document.fileid;
        const file = await bot.getFile(fileId);
        const fileUrl = https://api.telegram.org/file/bot${bot.token}/${file.filepath};
        const res = await fetch(fileUrl);
        const buffer = await res.arrayBuffer();
        const localPath = path.join(process.cwd(), fileName);
        fs.writeFileSync(localPath, Buffer.from(buffer));

        session.files.push(localPath);
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ✅ File Diterima
│
│  File: ${fileName}
│
│  Total: ${session.files.length}
│
│  Kirim lagi atau ketik 'done'
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Download Gagal
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return sendWithDelete(userId, chatId, 
          ◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses Dibatalkan
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
      }

      const outputName = text.trim().replace(/[^a-zA-Z0-9-]/g, "") || "gabungan";
      const ext = session.fileType === "vcf" ? ".vcf" : session.fileType === "txt" ? ".txt" : ".xlsx";
      const outputFile = path.join(process.cwd(), ${outputName}${ext});

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
          ◆◆  GABUNG FILE ✅ SUKSES  ◆◆

┌─❖
│  📂 Hasil Gabung
│
│  File: ${outputName}${ext}
│
│  Total: ${session.files.length} file
│
│  Tipe: ${session.fileType.toUpperCase()}
│
│  💎 Terima kasih!
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
        );
        
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Merge error:", err);
        bot.sendMessage(chatId, 
          ◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Gabung Gagal
└─❖, 
          { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
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
    const data = XLSX.utils.sheettojson(worksheet);
    allData = allData.concat(data);
  }
  
  if (allData.length > 0) {
    const newWorkbook = XLSX.utils.booknew();
    const newWorksheet = XLSX.utils.jsontosheet(allData);
    XLSX.utils.bookappend_sheet(newWorkbook, newWorksheet, "Sheet1");
    XLSX.writeFile(newWorkbook, outputFile);
  }
}
