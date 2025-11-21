import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button
  bot.onText(/^⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ$/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `❌ *Yah… fitur ini khusus VIP nih Kak* 😔\n\n` +
        `Upgrade ke VIP dulu ya untuk akses semua fitur premium!\n` +
        `Hubungi @Iqbaldev untuk info lebih lanjut 💎`,
        { 
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        }
      );
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `🔢 *Hitung Kontak di File*\n\n` +
      `Silakan kirim file yang mau dihitung ya Kak ✨\n\n` +
      `Format yang didukung:\n` +
      `• 📄 TXT (nomor per baris)\n` +
      `• 📇 VCF (vCard)\n\n` +
      `Ketik \`batal\` untuk membatalkan.`,
      { 
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      }
    );
  });

  // Handle /hitungfile command
  bot.onText(/^\/hitungfile$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `❌ *Yah… fitur ini khusus VIP nih Kak* 😔\n\n` +
        `Upgrade ke VIP dulu ya untuk akses semua fitur premium!\n` +
        `Hubungi @Iqbaldev untuk info lebih lanjut 💎`,
        { 
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        }
      );
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `🔢 *Hitung Kontak di File*\n\n` +
      `Silakan kirim file yang mau dihitung ya Kak ✨\n\n` +
      `Format yang didukung:\n` +
      `• 📄 TXT (nomor per baris)\n` +
      `• 📇 VCF (vCard)\n\n` +
      `Ketik \`batal\` untuk membatalkan.`,
      { 
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      }
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
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      }

      if (!msg.document) {
        return bot.sendMessage(
          chatId, 
          "⚠️ *Kirim file dulu ya Kak* 😊",
          { 
            parse_mode: "Markdown",
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
          "⚠️ *Hanya support TXT atau VCF ya Kak* 😊",
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
          `✅ *Berhasil hitung kontak Kak!* 📊\n\n` +
          `📂 *File:* \`${fileName}\`\n` +
          `📏 *Ukuran:* ${fileSize} KB\n\n` +
          `📊 *Detail:*\n` +
          `• Total kontak: *${count}*\n` +
          `• Kontak unik: *${unique}*\n` +
          `• Duplikat: *${duplicates}*\n\n` +
          `Semoga membantu ya! 😊`,
          { 
            parse_mode: "Markdown",
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
          "⚠️ *Yah… ada masalah saat hitung file* 😔\n\nCoba lagi ya Kak!",
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
