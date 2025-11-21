import fs from "fs";
import path from "path";

function createVcfEntry(phone, name) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:+${phone.replace(/\D/g, "")}`,
    "END:VCARD",
  ].join("\n");
}

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📄 *TXT to VCF Converter*\n\nKirim file TXT yang mau diubah jadi VCF ya Kak ✨\n\nKetik \`batal\` untuk membatalkan.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/txttovcf$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📄 *TXT to VCF Converter*\n\nKirim file TXT yang mau diubah jadi VCF ya Kak ✨\n\nKetik \`batal\` untuk membatalkan.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId, "⚠️ *Harus file TXT ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".txt", "");
      session.step = 2;

      return bot.sendMessage(chatId, `📝 *Masukkan nama file VCF ya Kak*\n\nTanpa ekstensi .vcf\n\nKetik \`skip\` untuk pakai nama sama.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      session.newFileName = /^skip$/i.test(text) ? session.originalName : text.replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = 3;
      return bot.sendMessage(chatId, `👤 *Masukkan nama prefix kontak ya Kak*\n\nContoh: "Teman" → "Teman-0001", "Teman-0002"\n\nKetik \`skip\` untuk pakai nama file.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      session.contactName = /^skip$/i.test(text) ? session.newFileName : text;

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const numbers = content.split(/\s+/).map((x) => x.replace(/[^\d+]/g, "")).filter((x) => x && /^\+?\d+$/.test(x));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(chatId, `⚠️ *Tidak ditemukan nomor valid di file Kak* 😔\n\nMinimal harus ada 1 nomor telepon.`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }

        const outputFile = `${session.newFileName}.vcf`;
        const outputPath = path.join(process.cwd(), outputFile);
        const vcfData = numbers.map((num, i) => createVcfEntry(num, `${session.contactName}-${String(i + 1).padStart(4, "0")}`)).join("\n");
        fs.writeFileSync(outputPath, vcfData);

        await bot.sendDocument(chatId, outputPath);
        bot.sendMessage(chatId, `✅ *File VCF berhasil dibuat Kak!* 🎉\n\n📂 *File:* \`${outputFile}\`\n👥 *Total kontak:* ${numbers.length}\n\nSemoga membantu ya! 😊`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        bot.incrementOperation(userId);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("TXT to VCF error:", err);
        bot.sendMessage(chatId, `⚠️ *Yah… ada masalah saat convert* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        try { fs.unlinkSync(session.file); } catch {}
      }

      delete sessions[userId];
    }
  });
}
