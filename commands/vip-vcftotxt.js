import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/vcftotxt$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Batasi akses hanya untuk owner/admin/vip
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses ke fitur ini.\n\nHubungi @oktodev untuk upgrade ke VIP.",
        { parse_mode: "HTML" }
      );
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      "📂 <b>Kirim file .vcf yang ingin kamu ubah menjadi file .txt</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .vcf!");
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
        "📝 <b>Masukkan nama file baru (tanpa .txt)</b>\nKetik <code>skip</code> untuk gunakan nama sama.",
        { parse_mode: "HTML" }
      );
    }

    // Step 2 → input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const outputName = /^skip$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const matches = content.match(/TEL;[^:]*:(\+?\d+)/g) || [];
        const numbers = matches.map((m) => m.replace(/.*:/, ""));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ Tidak ditemukan nomor telepon di file!");
        }

        const outputFile = `${outputName}.txt`;
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, numbers.join("\n"));

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ <b>File TXT berhasil dibuat!</b>\nNama file: <code>${outputFile}</code>`,
          { parse_mode: "HTML" }
        );

        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal convert:", err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat konversi file.");
      }

      delete sessions[userId];
    }
  });
}