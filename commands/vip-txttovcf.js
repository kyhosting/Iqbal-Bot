import fs from "fs";
import path from "path";

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

  bot.onText(/^⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆ TXT TO VCF\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(
      chatId,
      `◆ TXT TO VCF\n(Mengubah file txt ke vcf)\n\n▸ Support Format:\n  • TXT (Text)\n  • XLS (Excel)\n\n▸ Satu nomor per baris (TXT)\n▸ Satu nomor per kolom (Excel)\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`,
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

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .txt!", { parse_mode: "Markdown" });
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".txt", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        `◆ TXT TO VCF\n\n▸ Nama File Baru\n\nMasukkan nama file hasil konversi\n(Tanpa ekstensi .vcf)\n\nKetik 'done' untuk skip\n\n◆`,
        { parse_mode: "Markdown" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.", { parse_mode: "Markdown" });
      }

      session.newFileName = /^done$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(
        chatId,
        `◆ TXT TO VCF\n\n▸ Nama Kontak Dasar\n\nMasukkan prefix nama kontak\n(Misal: Contact, Admin, dll)\n\nKetik 'done' untuk pakai nama file\n\n◆`,
        { parse_mode: "Markdown" }
      );
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.", { parse_mode: "Markdown" });
      }

      session.contactName = /^done$/i.test(text)
        ? session.newFileName
        : text.trim();

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const numbers = content
          .split(/\s+/)
          .map((x) => x.replace(/[^\d+]/g, ""))
          .filter((x) => x && /^\+?\d+$/.test(x));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ Tidak ditemukan nomor yang valid di file.", { parse_mode: "Markdown" });
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
          `✅ *File VCF berhasil dibuat!*\n📂 *Nama file:* \`${outputFile}\``,
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
