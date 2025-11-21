import fs from "fs";
import path from "path";

function createVcfEntry(phone, name) {
  const cleanPhone = phone.replace(/\D/g, "");
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:${cleanPhone}`,
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
      return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n(Konversi TXT ke VCF)\n\n▸ Kirim file TXT yang mau diubah\n\nFile harus berisi nomor telepon\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/txttovcf$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n(Konversi TXT ke VCF)\n\n▸ Kirim file TXT yang mau diubah\n\nFile harus berisi nomor telepon\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ⚠️ File Harus TXT\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      try {
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

        bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ Nama File Output\n\nMasukkan nama file (tanpa .vcf)\nAtau ketik 'skip' untuk pakai nama lama\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ⚠️ Gagal Download\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.file); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      session.newFileName = /^skip$/i.test(text) ? session.originalName : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = 3;
      bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ Nama Prefix Kontak\n\nMasukkan nama prefix kontak\nAtau ketik 'skip' untuk pakai nama file\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.file); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      session.contactName = /^skip$/i.test(text) ? session.newFileName : text.trim();

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const numbers = content
          .split(/[\s\n\r]+/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.replace(/\D/g, ""))
          .filter(num => num.length >= 7 && num.length <= 15);

        if (numbers.length === 0) {
          try { fs.unlinkSync(session.file); } catch {}
          delete sessions[userId];
          return bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ⚠️ Nomor Tidak Ditemukan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }

        const outputFile = `${session.newFileName}.vcf`;
        const outputPath = path.join(process.cwd(), outputFile);
        
        const vcfData = numbers
          .map((num, i) => createVcfEntry(num, `${session.contactName}-${String(i + 1).padStart(4, "0")}`))
          .join("\n");
        
        fs.writeFileSync(outputPath, vcfData);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ - ✅ SUKSES\n\n▸ Nama File: ${outputFile}\n▸ Total Kontak: ${numbers.length}\n▸ Prefix: ${session.contactName}\n\n💎 Terima kasih sudah menggunakan bot ini 🙏\nJangan lupa support bot dengan subscribe channel 🤗\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        
        bot.incrementOperation(userId);
        try { fs.unlinkSync(outputPath); } catch {}
        try { fs.unlinkSync(session.file); } catch {}
      } catch (err) {
        console.error("Conversion error:", err);
        bot.sendMessage(chatId, `◆ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n\n▸ ⚠️ Konversi Gagal\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        try { fs.unlinkSync(session.file); } catch {}
      }

      delete sessions[userId];
    }
  });
}
