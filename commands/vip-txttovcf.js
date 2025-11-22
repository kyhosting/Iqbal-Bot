import fs from "fs";
import path from "path";

// Fungsi pembuat file VCF
function createVcfEntry(phone, name) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:+${phone.replace(/\D/g, "")}`,
    "END:VCARD",
  ].join("\n");
}

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/txttovcf$/, (msg) => {
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
      "📂 <b>Kirim file .txt yang ingin kamu ubah menjadi file VCF</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    // Step 1 → Kirim file txt
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .txt!");
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      // Unduh file txt
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".txt", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        "📝 <b>Masukkan nama file baru (tanpa .vcf)</b>\nKetik <code>skip</code> untuk menggunakan nama sama.",
        { parse_mode: "HTML" }
      );
    }

    // Step 2 → Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      session.newFileName = /^skip$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(
        chatId,
        "📇 <b>Masukkan nama kontak dasar</b>\nKetik <code>skip</code> untuk gunakan nama file.",
        { parse_mode: "HTML" }
      );
    }

    // Step 3 → Input nama kontak
    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      session.contactName = /^skip$/i.test(text)
        ? session.newFileName
        : text.trim();

      // Proses konversi
      try {
        const content = fs.readFileSync(session.file, "utf8");
        const numbers = content
          .split(/\s+/)
          .map((x) => x.replace(/[^\d+]/g, ""))
          .filter((x) => x && /^\+?\d+$/.test(x));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ Tidak ditemukan nomor yang valid di file.");
        }

        const outputFile = `${session.newFileName}.vcf`;
        const outputPath = path.join(process.cwd(), outputFile);
        const vcfData = numbers
          .map((num, i) =>
            createVcfEntry(num, `${session.contactName}-${String(i + 1).padStart(4, "0")}`)
          )
          .join("\n");
        fs.writeFileSync(outputPath, vcfData);

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(
          chatId,
          `✅ <b>File VCF berhasil dibuat!</b>\nNama file: <code>${outputFile}</code>`,
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