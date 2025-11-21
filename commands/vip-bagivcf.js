import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ ʙᴀɢɪ ᴠᴄꜰ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📤 *Bagi File VCF*\n\nSilakan kirim file VCF yang mau dibagi ya Kak ✨\n\nKetik \`batal\` untuk membatalkan.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/bagivcf$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📤 *Bagi File VCF*\n\nSilakan kirim file VCF yang mau dibagi ya Kak ✨\n\nKetik \`batal\` untuk membatalkan.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
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
      session.originalName = msg.document.file_name.replace(".vcf", "");
      session.step = 2;

      return bot.sendMessage(chatId, `📎 *Masukkan nama file output ya Kak*\n\nTanpa ekstensi .vcf\n\nKetik \`skip\` untuk gunakan nama sama`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      session.newFileName = /^skip$/i.test(text) ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = 3;
      return bot.sendMessage(chatId, `🔢 *Berapa jumlah file hasil potongan ya Kak?*`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      const jumlahFile = parseInt(text);
      if (isNaN(jumlahFile) || jumlahFile <= 0) {
        return bot.sendMessage(chatId, "⚠️ *Masukkan angka yang valid ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      try {
        const hasil = splitCutVcf(session.file, session.newFileName, jumlahFile);

        for (const f of hasil) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        fs.unlinkSync(session.file);
        bot.sendMessage(chatId, `✅ *File berhasil dibagi Kak!* 🎉\n\n📊 Total: ${hasil.length} bagian\n\nSemoga membantu ya! 😊`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Gagal membagi file:", err);
        bot.sendMessage(chatId, "⚠️ *Yah… ada masalah saat membagi file* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      delete sessions[userId];
    }
  });
}

function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const contacts = data.split(/END:VCARD\s*/i).filter(Boolean).map((x) => x.trim() + "\nEND:VCARD");
  return contacts;
}

function writeVcf(contacts, filePath) {
  fs.writeFileSync(filePath, contacts.join("\n"));
}

function splitCutVcf(inputFile, baseName, totalFiles = 2) {
  const contacts = readVcf(inputFile);
  const totalContacts = contacts.length;
  const perFile = Math.ceil(totalContacts / totalFiles);
  const files = [];

  for (let i = 0; i < totalFiles; i++) {
    const start = i * perFile;
    const end = Math.min(start + perFile, totalContacts);
    const chunk = contacts.slice(start, end);
    const fileName = `${baseName}-${i + 1}.vcf`;
    writeVcf(chunk, fileName);
    files.push(path.join(process.cwd(), fileName));
  }

  return files;
}
