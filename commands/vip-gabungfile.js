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

  bot.onText(/^⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️$|^⛓️ GABUNG FILE ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, 
        `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`, 
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1, files: [], fileType: null };
    trackMessage(userId, chatId, 
      `◆◆  GABUNG FILE  ◆◆

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
└─❖`, 
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
        return sendWithDelete(userId, chatId, 
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses Dibatalkan
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, 
            `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ File Kurang
│
│  Minimal 2 file untuk digabung
└─❖`, 
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }
        session.step = 2;
        return trackMessage(userId, chatId,
          `◆◆  GABUNG FILE  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Ketik 'skip' pakai nama otomatis
│  Ketik 'batal' batalkan
└─❖`, 
          { parse_mode: "HTML" }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(chatId, 
          `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Bukan File
│
│  Kirim file VCF/TXT/XLS
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.file_name || "";
      const isVcf = fileName.endsWith(".vcf");
      const isTxt = fileName.endsWith(".txt");
      const isXls = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isVcf && !isTxt && !isXls) {
        return bot.sendMessage(chatId, 
          `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Tipe File Salah
│
│  Hanya VCF, TXT, XLSX
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const currentType = isVcf ? "vcf" : isTxt ? "txt" : "xls";
      if (session.fileType && session.fileType !== currentType) {
        return bot.sendMessage(chatId, 
          `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ⚠️ Tipe File Berbeda
│
│  Semua file harus tipe sama
│
│  Sebelum: ${session.fileType.toUpperCase()}
│
│  Sekarang: ${currentType.toUpperCase()}
└─❖`, 
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

        const panelText = `◆◆  GABUNG FILE  ◆◆

┌─❖
│  ✅ ${session.files.length} file diterima
│
│  Kirim file lagi atau ketik:
│  • done  — proses & kirim hasil
│  • batal — batalkan
└─❖`;

        // Jika ini file pertama, kirim pesan baru
        if (session.files.length === 1) {
          const sentMsg = await bot.sendMessage(chatId, panelText, { parse_mode: "HTML" });
          session.panelMessageId = sentMsg.message_id;
          return;
        }

        // Jika sudah ada file sebelumnya, edit pesan yang ada
        if (session.panelMessageId) {
          try {
            await bot.editMessageText(panelText, {
              chat_id: chatId,
              message_id: session.panelMessageId,
              parse_mode: "HTML"
            });
          } catch (e) {
            console.error("Error editing message:", e);
          }
        }
        return;
      } catch (e) {
        console.error(e);
        return bot.sendMessage(chatId, 
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Gagal download file
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return sendWithDelete(userId, chatId, 
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const outputName = /^skip$/i.test(text)
        ? `gabung_${Date.now()}`
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      const ext = session.fileType;
      const outputFile = `${outputName}.${ext}`;

      try {
        if (ext === "vcf" || ext === "txt") {
          const contents = session.files
            .map((f) => fs.readFileSync(f, "utf8"))
            .join("\n");
          const outputPath = path.join(process.cwd(), outputFile);
          fs.writeFileSync(outputPath, contents);
          await bot.sendDocument(chatId, outputPath);
          fs.unlinkSync(outputPath);
        } else {
          const workbook = XLSX.utils.book_new();
          const allRows = [];
          for (const file of session.files) {
            const wb = XLSX.readFile(file);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws);
            allRows.push(...rows);
          }
          const ws = XLSX.utils.json_to_sheet(allRows);
          XLSX.utils.book_append_sheet(workbook, ws);
          const outputPath = path.join(process.cwd(), outputFile);
          XLSX.writeFile(workbook, outputPath);
          await bot.sendDocument(chatId, outputPath);
          fs.unlinkSync(outputPath);
        }

        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];

        bot.incrementOperation(userId);
        return sendWithDelete(userId, chatId, 
          `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File berhasil digabung
│
│  📄 Total file: ${session.files.length}
│  📄 Nama: ${outputFile}
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } catch (e) {
        console.error(e);
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return sendWithDelete(userId, chatId, 
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Gagal gabung file
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
    }
  });
}
