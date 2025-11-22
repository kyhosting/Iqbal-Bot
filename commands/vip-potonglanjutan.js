import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ$|^\/potonglanjutan$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ POTONG LANJUTAN\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1, splitCounter: 1, fileCounter: 1 };
    bot.sendMessage(chatId, `◆ POTONG LANJUTAN\n(Cut VCF Advanced)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Potong file sesuai range\n▸ Kontak yang ditentukan\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ <b>Harus file VCF ya Kak</b> 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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

      bot.sendMessage(chatId, `📎 <b>Masukkan nama file output ya Kak</b>\n\nKetik \`skip\` untuk pakai nama lama`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.newFileName = /^skip$/i.test(text) || !text ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = session.splitCounter === 1 ? 3 : 5;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, `🔢 <b>Masukkan angka awal penomoran kontak ya Kak</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } else {
        bot.sendMessage(chatId, `📄 <b>Berapa kontak per file ya Kak?</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.splitCounter = parseInt(text);
      session.step = 4;
      bot.sendMessage(chatId, `🔢 <b>Masukkan angka awal nama file ya Kak</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 4) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      session.fileCounter = parseInt(text);
      session.step = 5;
      bot.sendMessage(chatId, `📄 <b>Berapa kontak per file ya Kak?</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      return;
    }

    if (session.step === 5) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const perFile = parseInt(text);
      try {
        const hasil = splitVcfCustom(session.file, session.newFileName, perFile, session.splitCounter, session.fileCounter);

        for (const f of hasil.files) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFile;
        fs.unlinkSync(session.file);

        session.step = 6;
        bot.sendMessage(chatId, `✅ <b>Selesai dipotong Kak!</b> 🎉\n\nKetik \`lanjut\` untuk file berikutnya\nKetik \`selesai\` untuk berhenti`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ <b>Yah… ada masalah saat potong file</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
      return;
    }

    if (session.step === 6) {
      if (/^lanjut$/i.test(text)) {
        session.step = 1;
        bot.sendMessage(chatId, `📤 <b>Kirim file VCF berikutnya ya Kak</b>\n\n✓ Ketik \`done\` setelah selesai\n✗ Ketik \`batal\` untuk membatalkan`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        return;
      }

      if (/^done$/i.test(text) || /^selesai$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "✅ Semua proses selesai ya Kak! 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      delete sessions[userId];
      return bot.sendMessage(chatId, "✅ Semua proses selesai ya Kak! 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
