import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ᴘᴏᴛᴏɴɢ ᴠᴄꜰ$|^\/potongvcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ POTONG VCF\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, splitCounter: 1, fileCounter: 1 };
    bot.sendMessage(chatId, `◆ POTONG VCF\n(Cut by Range)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Minimal 1 file\n▸ Tentukan range kontak yang ingin dipotong\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ *Harus file VCF ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.step = 2;

      return bot.sendMessage(chatId, `📎 *Masukkan nama file output ya Kak*\n\nTanpa ekstensi .vcf\n\nKetik \`skip\` untuk pakai nama asli`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const originalName = path.basename(session.file, ".vcf");
      session.outputName = /^skip$/i.test(text) ? originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(chatId, `🔢 *Berapa kontak per file ya Kak?*`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const jumlah = parseInt(text);
      if (isNaN(jumlah) || jumlah <= 0) {
        return bot.sendMessage(chatId, "⚠️ *Masukkan angka yang valid ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      try {
        const hasil = splitVcfSession(session.file, session.outputName, jumlah, session.splitCounter, session.fileCounter);

        for (const f of hasil.files) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        fs.unlinkSync(session.file);
        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFileIndex;

        bot.sendMessage(chatId, `✅ *Selesai dipotong Kak!* 🎉\n\nTotal: ${hasil.nextIndex - 1} kontak\n\nSemoga membantu ya! 😊`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Gagal memotong:", err);
        bot.sendMessage(chatId, "⚠️ *Yah… ada masalah saat potong file* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      delete sessions[userId];
    }
  });
}

function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const contacts = data.split(/END:VCARD\s*/i).filter(Boolean).map(x => x.trim() + "\nEND:VCARD");
  return contacts;
}

function renameContacts(contacts, startIndex = 1) {
  return contacts.map((entry, i) => {
    return entry.replace(/FN:.*/i, `FN:Contact-${String(startIndex + i).padStart(4, "0")}`);
  });
}

function writeVcf(contacts, filePath) {
  fs.writeFileSync(filePath, contacts.join("\n"));
}

function splitVcfSession(inputFile, baseName, perFile = 100, startIndex = 1, startFile = 1) {
  const contacts = readVcf(inputFile);
  const total = contacts.length;
  const fileCount = Math.ceil(total / perFile);
  const files = [];
  let globalIndex = startIndex;
  let fileIndex = startFile;

  for (let i = 0; i < fileCount; i++) {
    const start = i * perFile;
    const end = Math.min(start + perFile, total);
    const chunk = renameContacts(contacts.slice(start, end), globalIndex);
    const fileName = `${baseName}-${fileIndex}.vcf`;
    writeVcf(chunk, fileName);
    files.push(path.join(process.cwd(), fileName));
    globalIndex += chunk.length;
    fileIndex++;
  }

  return {
    files,
    nextIndex: globalIndex,
    nextFileIndex: fileIndex,
  };
}
