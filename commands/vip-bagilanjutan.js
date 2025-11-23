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

  bot.onText(/^⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ$|^⛓️ BAGI LANJUT ⛓️$|^\/bagilanjutan$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1, splitCounter: 1, fileCounter: 1 };
    trackMessage(userId, chatId, `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  Split VCF Advanced
│
│  Bagi file sesuai kontak
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
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
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return trackMessage(userId, chatId, `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  ⚠️ Kirim file VCF
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
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

      trackMessage(userId, chatId, `📎 Masukkan nama file output ya Kak\n\nKetik \`skip\` untuk pakai nama lama.`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.newFileName = /^skip$/i.test(text) || !text ? session.originalName : text.replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = session.splitCounter === 1 ? 3 : 5;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, `🔢 Masukkan angka awal penomoran kontak ya Kak\n\nContoh: 100 → "Nama-100", "Nama-101", dsb.`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      } else {
        bot.sendMessage(chatId, `🪓 Berapa jumlah file (bagian) yang mau dibuat ya Kak?`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
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
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.splitCounter = parseInt(text);
      session.step = 4;
      bot.sendMessage(chatId, `🔢 Masukkan angka awal nama file ya Kak\n\nContoh: 1 → "nama-1.vcf", "nama-2.vcf", dsb.`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 4) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.fileCounter = parseInt(text);
      session.step = 5;
      bot.sendMessage(chatId, `🪓 Berapa jumlah file (bagian) yang mau dibuat ya Kak?`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 5) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text)) || parseInt(text) <= 0) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const bagian = parseInt(text);
      try {
        const hasil = splitVcfByPart(session.file, session.newFileName, bagian, session.splitCounter, session.fileCounter);

        for (const f of hasil.files) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFile;
        fs.unlinkSync(session.file);

        session.step = 6;
        bot.sendMessage(chatId, `✅ Selesai dibagi Kak! 🎉\n\n📊 Total: ${hasil.files.length} file\n\nKetik \`lanjut\` untuk file berikutnya\nKetik \`selesai\` untuk berhenti`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Yah… ada masalah saat membagi file 😔",  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 6) {
      if (/^lanjut$/i.test(text)) {
        session.step = 1;
        bot.sendMessage(chatId, `📤 Kirim file VCF berikutnya ya Kak\n\nNomor kontak melanjut dari sebelumnya 📈\n\n✓ Ketik \`done\` setelah selesai\n✗ Ketik \`batal\` untuk membatalkan`,  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
        return;
      }

      if (/^done$/i.test(text) || /^selesai$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, "✅ Semua proses selesai ya Kak! 😊",  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      delete sessions[userId];
      return trackMessage(userId, chatId, "✅ Semua proses selesai ya Kak! 😊",  { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
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

function renameContacts(contacts, startIndex) {
  let index = startIndex;
  return contacts.map((c) => {
    const match = c.match(/FN:(.*)/i);
    if (!match) return c;

    const namaAsli = match[1].trim();
    const namaDasar = extractBaseName(namaAsli);
    const namaBaru = `${namaDasar}-${index}`;
    const updated = c.replace(/FN:(.*)/i, `FN:${namaBaru}`);
    index++;
    return updated;
  });
}

function splitVcfByPart(filePath, baseName, parts, startIndex, startFile) {
  const contacts = readVcf(filePath);
  const total = contacts.length;
  const perFile = Math.ceil(total / parts);
  const hasil = [];
  let nextIndex = startIndex;
  let nextFile = startFile;

  for (let i = 0; i < total; i += perFile) {
    const chunk = renameContacts(contacts.slice(i, i + perFile), nextIndex);
    const fileName = `${baseName}-${nextFile}.vcf`;
    const outputPath = path.join(process.cwd(), fileName);
    fs.writeFileSync(outputPath, chunk.join("\n"));
    hasil.push(outputPath);

    nextIndex += chunk.length;
    nextFile++;
  }

  return { files: hasil, nextIndex, nextFile };
}
