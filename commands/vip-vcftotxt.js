import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ$|^\/vcftotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  VCF TO TXT  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessions[userId] = { step: 1 };
    return await bot.sendMessage(chatId,
      `◆◆  VCF TO TXT  ◆◆

┌─❖
│  Convert VCF ke TXT
│
│  Support: VCF
│
│  Ekstrak nomor dari kontak
│
│  Kirim file untuk start
└─❖`,
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId,
          `◆◆  VCF TO TXT  ◆◆

┌─❖
│  ⚠️ Kirim file .vcf
└─❖`,
          { parse_mode: "HTML" }
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

      return bot.sendMessage(chatId,
        `◆◆  VCF TO TXT  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Masukkan nama file hasil
│
│  (Tanpa ekstensi)
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
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
          return bot.sendMessage(chatId,
            `◆◆  VCF TO TXT  ◆◆

┌─❖
│  ⚠️ Nomor tidak ditemukan
└─❖`,
            { parse_mode: "HTML" }
          );
        }

        const outputFile = `${outputName}.txt`;
        const outputPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, numbers.join("\n"));

        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(chatId,
          `◆◆  KONVERSI SUKSES  ◆◆

┌─❖
│  ✅ TXT berhasil dibuat
│
│  File: ${outputFile}
│
│  Total: ${numbers.length} nomor
└─❖`,
          { parse_mode: "HTML" }
        );

        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal convert:", err);
        bot.sendMessage(chatId,
          `◆◆  VCF TO TXT  ◆◆

┌─❖
│  ⚠️ Konversi gagal
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      delete sessions[userId];
    }
  });
}
