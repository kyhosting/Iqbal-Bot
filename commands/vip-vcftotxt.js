import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ$, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ VCF TO TXT\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ VCF TO TXT\n(Mengubah file vcf ke txt)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Kirim file VCF (bisa multiple)\n▸ Minimal 1 file\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
      { parse_mode: "Markdown" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text) || /^done$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.", { parse_mode: "Markdown" });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .vcf!", { parse_mode: "Markdown" });
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
        `◆ VCF TO TXT\n\n▸ Nama File Output\n\nMasukkan nama file hasil konversi\n(Tanpa ekstensi .txt)\n\nKetik 'done' untuk skip\n\n◆`,
        { parse_mode: "Markdown" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.", { parse_mode: "Markdown" });
      }

      const outputName = /^done$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const matches = content.match(/TEL;[^:]*:(\+?\d+)/g) || [];
        const numbers = matches.map((m) => m.replace(/.*:/, ""));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ Tidak ditemukan nomor telepon di file!", { parse_mode: "Markdown" });
        }

        const outputFile = `${outputName}.txt`;
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, numbers.join("\n"));

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ *File TXT berhasil dibuat!*\n📂 *Nama file:* \`${outputFile}\``,
          { parse_mode: "Markdown" }
        );

        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal convert:", err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat konversi file.", { parse_mode: "Markdown" });
      }

      delete sessions[userId];
    }
  });
}
