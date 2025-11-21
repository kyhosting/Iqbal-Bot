import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /renamekontak command (unified)
  bot.onText(/^⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ$|^\/renamekontak$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ RENAME KONTAK\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );
    }

    // Verify group membership
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ RENAME KONTAK\n(Rename All Contacts)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Ubah nama semua kontak\n▸ Dalam file VCF\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → kirim file .vcf
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(
          chatId,
          "⚠️ *Harus file VCF ya Kak* 😊\n\nCoba kirim file dengan ekstensi .vcf",
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

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".vcf", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        `📝 *Masukkan nama kontak baru ya Kak*\n\n` +
        `Semua kontak di file ini akan diganti namanya dengan nama yang kamu masukkan.\n\n` +
        `Contoh: Iqbal CV, Teman Iqbal, dll\n\n` +
        `✓ Ketik \`done\` setelah selesai\n` +
        `✗ Ketik \`batal\` untuk membatalkan`,
        { 
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        }
      );
    }

    // Step 2 → input nama kontak baru
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (/^done$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Nama kontak tidak boleh kosong Kak 😊\n\nCoba lagi ya!",
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      const newContactName = text.trim();

      try {
        const content = fs.readFileSync(session.file, "utf8");
        
        // Ganti semua FN: dengan nama baru
        const updatedContent = content.replace(/FN:[^\r\n]*/g, `FN:${newContactName}`);
        
        const outputFile = `${session.originalName}_renamed.vcf`;
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, updatedContent);

        // Hitung total kontak
        const contactCount = (content.match(/BEGIN:VCARD/g) || []).length;

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ *Semua kontak berhasil direname Kak!* 🎉\n\n` +
          `👤 *Nama baru:* ${newContactName}\n` +
          `📊 *Total kontak:* ${contactCount}\n` +
          `📂 *File baru:* \`${outputFile}\`\n\n` +
          `Semoga membantu ya! 😊`,
          { 
            parse_mode: "Markdown",
            reply_markup: bot.getMainKeyboard()
          }
        );

        bot.incrementOperation(userId);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal rename kontak:", err);
        bot.sendMessage(
          chatId,
          "⚠️ *Yah… ada masalah saat rename kontak* 😔\n\nCoba lagi ya Kak!",
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
