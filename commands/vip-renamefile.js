import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /renamefile command (MERGED - no duplicate!)
  bot.onText(/^⛓️ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ$|^\/renamefile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ RENAME FILE\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    // Verify group membership
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ RENAME FILE\n(Rename File)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n  • XLSX (Excel)\n\n▸ Ubah nama file Anda\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → kirim file
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId,
          "⚠️ <b>Kirim file dulu ya Kak</b> 😊",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
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

      const ext = path.extname(msg.document.file_name);
      session.file = localPath;
      session.ext = ext;
      session.originalName = msg.document.file_name;
      session.step = 2;

      return bot.sendMessage(
        chatId,
        `📝 <b>Masukkan nama baru untuk file ya Kak</b>\n\n` +
        `File asli: \`${msg.document.file_name}\`\n` +
        `Ekstensi: \`${ext}\`\n\n` +
        `Ketik nama baru (tanpa ekstensi).\n` +
        `Ketik \`skip\` untuk pakai nama yang sama.\n\n` +
        `✓ Ketik \`done\` setelah selesai\n` +
        `✗ Ketik \`batal\` untuk batalkan`,
        { 
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        }
      );
    }

    // Step 2 → input nama baru
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (/^done$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Nama file tidak boleh kosong Kak 😊\n\nCoba lagi ya!",
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      let newName = text;
      if (/^skip$/i.test(text)) {
        newName = path.basename(session.originalName, session.ext);
      } else {
        newName = text.trim().replace(/[^a-zA-Z0-9-_\s]/g, "_");
      }

      const outputFile = `${newName}${session.ext}`;
      const outputPath = path.join(process.cwd(), outputFile);

      try {
        fs.copyFileSync(session.file, outputPath);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ <b>File berhasil direname Kak!</b> 🎉\n\n` +
          `📂 <b>Nama lama:</b> \`${session.originalName}\`\n` +
          `📂 <b>Nama baru:</b> \`${outputFile}\`\n\n` +
          `Semoga membantu ya! 😊`,
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );

        bot.incrementOperation(userId);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal rename file:", err);
        bot.sendMessage(
          chatId,
          "⚠️ <b>Yah… ada masalah saat rename file</b> 😔\n\nCoba lagi ya Kak!",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      delete sessions[userId];
    }
  });
}
