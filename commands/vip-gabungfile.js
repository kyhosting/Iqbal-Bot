/**
 * 🎌 IQBAL CV BOT - OFFICIAL MODULE 🎌
 * 
 * 🔐 BY: KIFZL & IQBAL DEV
 * 📝 DO NOT RENAME, MODIFY OR REDISTRIBUTE
 * 
 * GitHub: https://github.com/kyhosting/Iqbal-Bot
 * License: MIT (Keep Credits Intact)
 * 
 * ⚠️  Unauthorized modification may result in legal action
 */

import fs from "fs";
import path from "path";
import XLSX from "xlsx";

export default function (bot, db, redeemDB, saveDB, saveRedeemDB) {
  const sessions = {};

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

    // Initialize session
    sessions[userId] = { 
      step: 1, 
      files: [], 
      fileNames: [], 
      fileType: null, 
      chatId: chatId,
      panelMessageId: null // Store ID pesan panel untuk delete/update
    };

    await bot.sendMessage(chatId, 
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
      // Batalkan
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        
        // Delete panel message jika ada
        if (session.panelMessageId) {
          try {
            await bot.deleteMessage(chatId, session.panelMessageId);
          } catch (e) {
            console.error("[GABUNG] Error deleting panel:", e.message);
          }
        }
        
        delete sessions[userId];
        
        await bot.sendMessage(chatId, 
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses Dibatalkan
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
        return;
      }

      // Selesai (done)
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
        await bot.sendMessage(chatId,
          `◆◆  GABUNG FILE  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Ketik 'skip' pakai nama otomatis
│  Ketik 'batal' batalkan
└─❖`, 
          { parse_mode: "HTML" }
        );
        return;
      }

      // Cek apakah bukan file
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
        session.fileNames.push(fileName);

        // Generate panel text
        const fileList = session.fileNames.map((fn, i) => `  ${i + 1}. ${fn}`).join("\n");
        const panelText = `✦✦  GABUNG FILE  ✦✦

┌──────────────────❖
│  ✅ ${session.files.length} file diterima
│
│  📄 File diterima:
${fileList}
│
│  Kirim file lagi atau ketik:
│  • done  — proses & kirim hasil
│  • batal — batalkan
└──────────────────❖`;

        // AUTO DELETE + SEND strategy
        if (session.panelMessageId !== null) {
          // Jika sudah ada panel sebelumnya: DELETE pesan lama
          try {
            await bot.deleteMessage(chatId, session.panelMessageId);
            console.log(`[GABUNG] Deleted old panel: ${session.panelMessageId}`);
          } catch (e) {
            console.error(`[GABUNG] Error deleting old panel: ${e.message}`);
          }
        }

        // SEND panel baru
        const newMsg = await bot.sendMessage(chatId, panelText, { parse_mode: "HTML" });
        session.panelMessageId = newMsg.message_id;
        console.log(`[GABUNG] Sent new panel: ${newMsg.message_id}`);

        return;
      } catch (e) {
        console.error(`[GABUNG] Error processing file: ${e.message}`);
        return bot.sendMessage(chatId, 
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Gagal download file
└─❖`, 
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
    }

    // Step 2: Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        
        // Delete panel message jika ada
        if (session.panelMessageId) {
          try {
            await bot.deleteMessage(chatId, session.panelMessageId);
          } catch (e) {
            console.error("[GABUNG] Error deleting panel:", e.message);
          }
        }
        
        delete sessions[userId];
        
        return bot.sendMessage(chatId, 
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
        
        // Delete panel message jika ada
        if (session.panelMessageId) {
          try {
            await bot.deleteMessage(chatId, session.panelMessageId);
          } catch (e) {
            console.error("[GABUNG] Error deleting panel:", e.message);
          }
        }
        
        delete sessions[userId];

        bot.incrementOperation(userId);
        return bot.sendMessage(chatId, 
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
        console.error(`[GABUNG] Error processing: ${e.message}`);
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        
        // Delete panel message jika ada
        if (session.panelMessageId) {
          try {
            await bot.deleteMessage(chatId, session.panelMessageId);
          } catch (e) {
            console.error("[GABUNG] Error deleting panel:", e.message);
          }
        }
        
        delete sessions[userId];
        
        return bot.sendMessage(chatId, 
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
