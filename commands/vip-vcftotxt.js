import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n(Konversi VCF ke TXT)\n\n▸ Kirim file VCF yang mau diubah\n\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/vcftotxt$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n(Konversi VCF ke TXT)\n\n▸ Kirim file VCF yang mau diubah\n\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ File Harus VCF\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        session.originalName = msg.document.file_name.replace(".vcf", ".txt");
        session.step = 2;

        bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ Nama File Output\n\nMasukkan nama file (tanpa .txt)\nAtau ketik 'skip' untuk pakai nama lama\nKetik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Gagal Download\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        try { fs.unlinkSync(session.file); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const outputName = /^skip$/i.test(text) ? session.originalName : `${text.trim().replace(/[^a-zA-Z0-9-_]/g, "_")}.txt`;
      const outputPath = path.join(process.cwd(), outputName);

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const matches = content.match(/TEL;[^:]*:(\+?\d+)/g) || [];
        const numbers = matches.map((m) => m.replace(/.*:/, "")).filter(n => n.trim());

        if (numbers.length === 0) {
          try { fs.unlinkSync(session.file); } catch {}
          delete sessions[userId];
          return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Nomor Tidak Ditemukan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }

        fs.writeFileSync(outputPath, numbers.join("\n"));

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ - ✅ SUKSES\n\n▸ Nama File: ${outputName}\n▸ Total Nomor: ${numbers.length}\n▸ Status: Berhasil Dikonversi\n\n💎 Terima kasih sudah menggunakan bot ini 🙏\nJangan lupa support bot dengan subscribe channel 🤗\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        
        bot.incrementOperation(userId);
        try { fs.unlinkSync(outputPath); } catch {}
        try { fs.unlinkSync(session.file); } catch {}
      } catch (err) {
        console.error("Conversion error:", err);
        bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Konversi Gagal\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        try { fs.unlinkSync(session.file); } catch {}
      }

      delete sessions[userId];
    }
  });
}
