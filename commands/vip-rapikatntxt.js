import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /rapikatntxt command
  bot.onText(/^⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ$|^\/rapikatntxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ RAPIKAN TXT\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );
    }

    // Verify group membership
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ RAPIKAN TXT\n(Clean & Sort)\n\n▸ Support Format:\n  • TXT (Text)\n\n▸ Hapus duplikat\n▸ Hapus baris kosong\n▸ Sort alfabetis\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → kirim file .txt
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(
          chatId, 
          "⚠️ *Harus file TXT ya Kak* 😊\n\nCoba kirim file dengan ekstensi .txt",
          { 
            parse_mode: "Markdown",
            reply_markup: bot.getMainKeyboard()
          }
        );
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      try {
        const content = fs.readFileSync(localPath, "utf8");
        const lines = content.split("\n");
        
        // Filter: hapus baris kosong, trim whitespace
        const filtered = lines
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Hapus duplikat menggunakan Set
        const unique = [...new Set(filtered)];
        
        // Urutkan
        unique.sort();
        
        const originalCount = filtered.length;
        const cleanCount = unique.length;
        const duplicateRemoved = originalCount - cleanCount;
        
        const outputName = msg.document.file_name.replace(".txt", "_bersih.txt");
        const outputPath = path.join(process.cwd(), outputName);
        fs.writeFileSync(outputPath, unique.join("\n"));

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ *File berhasil dirapikan Kak!* 🎉\n\n` +
          `📊 *Statistik:*\n` +
          `• Total awal: ${originalCount} nomor\n` +
          `• Setelah dibersihkan: ${cleanCount} nomor\n` +
          `• Duplikat dihapus: ${duplicateRemoved} nomor\n\n` +
          `File baru: \`${outputName}\``,
          { 
            parse_mode: "Markdown",
            reply_markup: bot.getMainKeyboard()
          }
        );

        bot.incrementOperation(userId);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error("Gagal rapikan txt:", err);
        bot.sendMessage(
          chatId, 
          "⚠️ *Yah… ada masalah saat rapikan file* 😔\n\nCoba lagi ya Kak!",
          { 
            parse_mode: "Markdown",
            reply_markup: bot.getMainKeyboard()
          }
        );
      }

      delete sessions[userId];
    }
  });
}
