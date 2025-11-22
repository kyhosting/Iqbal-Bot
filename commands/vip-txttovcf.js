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
  const userMessages = {};

  async function sendWithDelete(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  bot.onText(/^⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ$|^\/txttovcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  TXT TO VCF  ◆◆

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
      `◆◆  TXT TO VCF  ◆◆

┌─❖
│  Convert TXT ke VCF
│
│  Support: TXT, XLS
│
│  Satu nomor per baris
│
│  Kirim file untuk start
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
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

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId,
          `◆◆  TXT TO VCF  ◆◆

┌─❖
│  ⚠️ Kirim file .txt
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
      session.originalName = msg.document.file_name.replace(".txt", "");
      session.step = 2;

      return bot.sendMessage(chatId,
        `◆◆  TXT TO VCF  ◆◆

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

      session.newFileName = /^done$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  📝 Nama Kontak Dasar
│
│  Prefix nama kontak
│
│  Contoh: Contact, Admin
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 3) {
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
          return bot.sendMessage(chatId,
            `◆◆  TXT TO VCF  ◆◆

┌─❖
│  ⚠️ Nomor tidak ditemukan
└─❖`,
            { parse_mode: "HTML" }
          );
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
        await bot.sendMessage(chatId,
          `◆◆  KONVERSI SUKSES  ◆◆

┌─❖
│  ✅ VCF berhasil dibuat
│
│  File: ${outputFile}
│
│  Total: ${numbers.length} kontak
└─❖`,
          { parse_mode: "HTML" }
        );

        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
      } catch (err) {
        console.error("Gagal convert:", err);
        bot.sendMessage(chatId,
          `◆◆  TXT TO VCF  ◆◆

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
