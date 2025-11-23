import fs from "fs";
import path from "path";

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

  bot.onText(/^⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️$|^⛓️ POTONG LANJUT ⛓️$|^\/potonglanjutan$/i, async (msg) => {
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

      trackMessage(userId, chatId, `📎 Masukkan nama file output ya Kak\n\nKetik \`skip\` untuk pakai nama lama`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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

      session.newFileName = /^skip$/i.test(text) || !text ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = session.splitCounter === 1 ? 3 : 5;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, `🔢 Masukkan angka awal penomoran kontak ya Kak`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } else {
        bot.sendMessage(chatId, `📄 Berapa kontak per file ya Kak?`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.splitCounter = parseInt(text);
      session.step = 4;
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
      session.step = 5;
      bot.sendMessage(chatId, `📄 Berapa kontak per file ya Kak?`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 5) {
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
        const hasil = splitVcfCustom(session.file, session.newFileName, perFile, session.splitCounter, session.fileCounter);

        // Sort files by numeric suffix untuk urutan yang rapi
        const sortedFiles = hasil.files.sort((a, b) => {
          const numA = parseInt(a.match(/-(\d+)\.vcf/)?.[1] || 0);
          const numB = parseInt(b.match(/-(\d+)\.vcf/)?.[1] || 0);
          return numA - numB;
        });

        // Kirim file BERURUTAN - TERSUSUN RAPI! 📂
        for (const f of sortedFiles) {
          await bot.sendDocument(chatId, f);
        }
        
        // Cleanup files
        sortedFiles.forEach(f => {
          try { fs.unlinkSync(f); } catch (e) {}
        });
        fs.unlinkSync(session.file);

        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFile;
        session.step = 6;
        
        // Kirim status langsung
        bot.sendMessage(chatId, `✅ Selesai dipotong Kak! 🎉\n\nKetik \`lanjut\` untuk file berikutnya\nKetik \`selesai\` untuk berhenti`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Yah… ada masalah saat potong file 😔",  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 6) {
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
