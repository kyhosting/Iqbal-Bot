import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /hitungfile command
  bot.onText(/^⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ$|^\/hitungfile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ HITUNG FILE\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboard() }
      );
    }

    // Verify group membership
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ HITUNG FILE\n(Count Contacts)\n\n▸ Support Format:\n  • TXT (Text)\n  • VCF (Contact)\n\n▸ Hitung total kontak/nomor\n▸ Minimal 1 file\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboard() }
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
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId, 
          "⚠️ <b>Kirim file dulu ya Kak</b> 😊",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboard()
          }
        );
      }

      const fileName = msg.document.file_name;
      const isTXT = fileName.endsWith(".txt");
      const isVCF = fileName.endsWith(".vcf");

      if (!isTXT && !isVCF) {
        return bot.sendMessage(
          chatId,
          "⚠️ <b>Hanya support TXT atau VCF ya Kak</b> 😊",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboard()
          }
        );
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), fileName);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      try {
        const content = fs.readFileSync(localPath, "utf8");
        let count = 0;
        let unique = 0;

        if (isTXT) {
          const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
          count = lines.length;
          unique = new Set(lines).size;
        } else if (isVCF) {
          const matches = content.match(/TEL;[^:]*:(\+?\d+)/g) || [];
          count = matches.length;
          const numbers = matches.map(m => m.replace(/.*:/, ""));
          unique = new Set(numbers).size;
        }

        const duplicates = count - unique;
        const fileSize = (msg.document.file_size / 1024).toFixed(2);

        await bot.sendMessage(
          chatId,
          `✅ <b>Berhasil hitung kontak Kak!</b> 📊\n\n` +
          `📂 <b>File:</b> \`${fileName}\`\n` +
          `📏 <b>Ukuran:</b> ${fileSize} KB\n\n` +
          `📊 <b>Detail:</b>\n` +
          `• Total kontak: <b>${count}</b>\n` +
          `• Kontak unik: <b>${unique}</b>\n` +
          `• Duplikat: <b>${duplicates}</b>\n\n` +
          `Semoga membantu ya! 😊`,
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboard()
          }
        );

        bot.incrementOperation(userId);
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error("Gagal hitung file:", err);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        bot.sendMessage(
          chatId,
          "⚠️ <b>Yah… ada masalah saat hitung file</b> 😔\n\nCoba lagi ya Kak!",
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboard()
          }
        );
      }

      delete sessions[userId];
    }
  });
}
