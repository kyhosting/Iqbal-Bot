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

export default function (bot, db, saveDB) {
  const sessions = {};
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ$|^\/txttovcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(
        chatId,
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
    return await trackMessage(
      userId,
      chatId,
      `◆◆  TXT TO VCF  ◆◆

┌─❖
│  Convert TXT ke VCF
│
│  Support: TXT
│
│  Format: nama◆nomor per baris
│
│  Kirim file untuk start
│
│  Ketik 'done' selesai
│  Ketik 'batal' batalkan
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
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(
          chatId,
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

      return bot.sendMessage(
        chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Masukkan nama file
│
│  (Tanpa ekstensi)
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
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
      return bot.sendMessage(
        chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  ⏳ Processing...
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 3) {
      try {
        const content = fs.readFileSync(session.file, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());
        const vcfEntries = lines.map((line) => {
          const parts = line.split("◆");
          const name = parts[0]?.trim() || "Kontak";
          const phone = parts[1]?.trim() || "0";
          return createVcfEntry(phone, name);
        });

        const vcfContent = vcfEntries.join("\n\n");
        const outputPath = path.join(
          process.cwd(),
          `${session.newFileName}.vcf`
        );
        fs.writeFileSync(outputPath, vcfContent);

        await bot.sendDocument(chatId, outputPath, {}, {
          filename: `${session.newFileName}.vcf`,
        });

        bot.incrementOperation(userId);
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File VCF dibuat
│
│  ${lines.length} kontak
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } catch (e) {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah
└─❖`,
          { parse_mode: "HTML" }
        );
      }
    }
  });
}
