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
      return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, files: [] };
    bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n(Batch Conversion)\n\n▸ Kirim file VCF (bisa multiple)\n▸ Ketik 'selesai' ketika sudah\n\nKetik 'batal' untuk membatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/vcftotxt$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, files: [] };
    bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n(Batch Conversion)\n\n▸ Kirim file VCF (bisa multiple)\n▸ Ketik 'selesai' ketika sudah\n\nKetik 'batal' untuk membatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];

    if (!session) return;

    if (session.step === 1) {
      // Cancel
      if (/^batal$/i.test(text)) {
        session.files.forEach(file => {
          try { fs.unlinkSync(file); } catch {}
        });
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      // Done processing
      if (/^selesai$/i.test(text)) {
        if (session.files.length === 0) {
          return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Belum ada file VCF\n\n◆`, { reply_markup: bot.getMainKeyboard() });
        }

        session.step = 2;
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ Nama File Output\n\nMasukkan nama prefix (tanpa ekstensi)\nAtau ketik 'skip' untuk pakai nama otomatis\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      // Check if it's a VCF file
      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ File Harus VCF\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      try {
        const fileId = msg.document.file_id;
        const file = await bot.getFile(fileId);
        const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        const res = await fetch(filePath);
        const buffer = await res.arrayBuffer();
        const localPath = path.join(process.cwd(), msg.document.file_name);
        fs.writeFileSync(localPath, Buffer.from(buffer));

        session.files.push({ path: localPath, name: msg.document.file_name.replace(".vcf", "") });
        bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ✅ File Diterima: ${msg.document.file_name}\n▸ Total: ${session.files.length} file\n\n▸ Kirim file lagi atau ketik 'selesai'\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      } catch (err) {
        console.error("Download error:", err);
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Gagal Download\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }
    }

    if (session.step === 2) {
      // Cancel at step 2
      if (/^batal$/i.test(text)) {
        session.files.forEach(file => {
          try { fs.unlinkSync(file.path); } catch {}
        });
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ❌ Proses Dibatalkan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
      }

      const prefix = /^skip$/i.test(text) ? "result" : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      try {
        const results = [];
        let totalNumbers = 0;

        // Process all files
        for (let i = 0; i < session.files.length; i++) {
          const fileData = session.files[i];
          const outputName = `${prefix}_${i + 1}.txt`;
          const outputPath = path.join(process.cwd(), outputName);

          const content = fs.readFileSync(fileData.path, "utf8");
          const matches = content.match(/TEL;[^:]*:(\+?\d+)/g) || [];
          const numbers = matches.map((m) => m.replace(/.*:/, "")).filter(n => n.trim());

          if (numbers.length > 0) {
            fs.writeFileSync(outputPath, numbers.join("\n"));
            results.push({ path: outputPath, name: outputName, count: numbers.length });
            totalNumbers += numbers.length;
          }
        }

        if (results.length === 0) {
          session.files.forEach(file => {
            try { fs.unlinkSync(file.path); } catch {}
          });
          delete sessions[userId];
          return bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Nomor Tidak Ditemukan\n\n◆`, { reply_markup: bot.getMainKeyboard() });
        }

        // Send all files
        for (const result of results) {
          await bot.sendDocument(chatId, result.path);
        }

        // Send summary message
        await bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ - ✅ SUKSES\n\n▸ Total File: ${results.length}\n▸ Total Nomor: ${totalNumbers}\n\n💎 Terima kasih sudah menggunakan bot ini 🙏\nJangan lupa support bot dengan subscribe channel 🤗\n\n◆`, { reply_markup: bot.getMainKeyboard() });

        bot.incrementOperation(userId);

        // Cleanup
        session.files.forEach(file => {
          try { fs.unlinkSync(file.path); } catch {}
        });
        results.forEach(result => {
          try { fs.unlinkSync(result.path); } catch {}
        });
        delete sessions[userId];
      } catch (err) {
        console.error("Conversion error:", err);
        bot.sendMessage(chatId, `◆ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n\n▸ ⚠️ Konversi Gagal\n\n◆`, { reply_markup: bot.getMainKeyboard() });
        delete sessions[userId];
      }
    }
  });
}
