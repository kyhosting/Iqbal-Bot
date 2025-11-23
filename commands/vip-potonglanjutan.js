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

export default function (bot, db, redeemDB, saveDB, saveRedeemDB) {
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

  bot.onText(/^⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️$|^⛓️ POTONG LANJUT ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  POTONG LANJUTAN  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1, splitCounter: 1, fileCounter: 1 };
    trackMessage(userId, chatId, `◆◆  POTONG LANJUTAN  ◆◆

┌─❖
│  Cut VCF Advanced
│
│  Potong file sesuai range
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return trackMessage(userId, chatId, `◆◆  POTONG LANJUTAN  ◆◆

┌─❖
│  ⚠️ Kirim file VCF
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".vcf", "");
      session.step = 2;

      trackMessage(userId, chatId, `◆◆  ⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`,  { parse_mode: "HTML" });
      return;
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!/^done$/i.test(text)) {
        return trackMessage(
          userId,
          chatId,
          `◆◆  ⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️  ◆◆

┌─❖
│  ⚠️ Ketik 'done' atau 'batal'
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.step = 3;
      trackMessage(userId, chatId, `◆◆  POTONG LANJUTAN  ◆◆

┌─❖
│  📎 Masukkan nama file output
│
│  Ketik 'skip' pakai nama lama
│  Ketik 'batal' batalkan
└─❖`,  { parse_mode: "HTML" });
      return;
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.newFileName = /^skip$/i.test(text) || !text ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = session.splitCounter === 1 ? 4 : 6;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, `🔢 Masukkan angka awal penomoran kontak ya Kak`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } else {
        bot.sendMessage(chatId, `📄 Berapa kontak per file ya Kak?`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.newFileName = /^skip$/i.test(text) || !text ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = session.splitCounter === 1 ? 4 : 6;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, `🔢 Masukkan angka awal penomoran kontak ya Kak`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } else {
        bot.sendMessage(chatId, `📄 Berapa kontak per file ya Kak?`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 4) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.splitCounter = parseInt(text);
      session.step = 5;
      bot.sendMessage(chatId, `🔢 Masukkan angka awal nama file ya Kak`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 4) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.fileCounter = parseInt(text);
      session.step = 6;
      bot.sendMessage(chatId, `📄 Berapa kontak per file ya Kak?`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 6) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const perFile = parseInt(text);
      try {
        // Baca contacts SEBELUM proses
        const contacts = readVcf(session.file);
        
        const hasil = splitVcfCustom(session.file, session.newFileName, perFile, session.splitCounter, session.fileCounter);

        // Sort files by numeric suffix untuk urutan yang rapi
        const sortedFiles = hasil.files.sort((a, b) => {
          const numA = parseInt(a.match(/-(\d+)\.vcf/)?.[1] || 0);
          const numB = parseInt(b.match(/-(\d+)\.vcf/)?.[1] || 0);
          return numA - numB;
        });

        // Kirim file BERURUTAN TERSUSUN RAPI - FAST! 🚀📂
        for (const f of sortedFiles) {
          await bot.sendDocument(chatId, f);
        }
        
        // Cleanup files
        sortedFiles.forEach(f => {
          try { fs.unlinkSync(f); } catch (e) {}
        });
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);

        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFile;
        session.step = 7;
        
        const kontakMsg = contacts.length > 0
          ? `\n\n👥 Kontak:\n${contacts.slice(0, 8).map((c, i) => {
              const match = c.match(/FN:(.*)/i);
              const name = match ? match[1].trim() : "Kontak";
              return `${i + 1}. ${name}`;
            }).join("\n")}${contacts.length > 8 ? `\n... dan ${contacts.length - 8} lainnya` : ""}`
          : "";
        
        // Kirim status langsung
        bot.sendMessage(chatId, `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File berhasil dipotong
│
│  📊 Total: ${contacts.length} kontak${kontakMsg}
│
│  Ketik 'lanjut' untuk file berikutnya
│  Ketik 'selesai' untuk berhenti
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Yah… ada masalah saat potong file 😔",  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 7) {
      if (/^lanjut$/i.test(text)) {
        session.step = 1;
        bot.sendMessage(chatId, `📤 Kirim file VCF berikutnya ya Kak\n\n✓ Ketik \`done\` setelah selesai\n✗ Ketik \`batal\` untuk membatalkan`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        return;
      }

      if (/^done$/i.test(text) || /^selesai$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, "✅ Semua proses selesai ya Kak! 😊",  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      delete sessions[userId];
      return trackMessage(userId, chatId, "✅ Semua proses selesai ya Kak! 😊",  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }
  });
}

function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data.split(/END:VCARD\s*/i).filter(Boolean).map((x) => x.trim() + "\nEND:VCARD");
}

function extractBaseName(name) {
  return name.replace(/[-_\s]*\d+$/, "");
}

function splitVcfCustom(filePath, baseName, perFile, startIndex, startFile) {
  const contacts = readVcf(filePath);
  const total = contacts.length;
  const hasil = [];
  let nextIndex = startIndex;
  let nextFile = startFile;

  for (let i = 0; i < total; i += perFile) {
    const chunk = contacts.slice(i, i + perFile).map((c) => {
      const match = c.match(/FN:(.*)/i);
      if (!match) return c;

      const namaAsli = match[1].trim();
      const namaDasar = extractBaseName(namaAsli);
      const namaBaru = `${namaDasar}-${nextIndex}`;

      const updated = c.replace(/FN:(.*)/i, `FN:${namaBaru}`);
      nextIndex++;
      return updated;
    });

    const fileName = `${baseName}-${nextFile}.vcf`;
    const outputPath = path.join(process.cwd(), fileName);
    fs.writeFileSync(outputPath, chunk.join("\n"));
    hasil.push(outputPath);

    nextFile++;
  }

  return { files: hasil, nextIndex, nextFile };
}
