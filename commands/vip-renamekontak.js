import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
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

  bot.onText(/^⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ$|^\/renamekontak$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  RENAME KONTAK  ◆◆

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
      `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  Rename All Contacts
│
│  Support: VCF
│
│  Ubah nama semua kontak
│
│  Kirim file VCF
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId,
          `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  ⚠️ Harus file VCF
│
│  Kirim file .vcf
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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
        `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  📝 Masukkan nama kontak
│
│  Semua kontak diganti
│
│  Contoh: Iqbal CV
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const newName = text.trim();
      const outputPath = path.join(process.cwd(), `${newName}.vcf`);

      try {
        const content = fs.readFileSync(session.file, "utf8");
        const vcards = content.split(/END:VCARD/i).filter(v => v.trim());

        const newVcards = vcards.map(vcard => {
          let updated = vcard.replace(/^FN:.*$/m, `FN:${newName}`);
          updated = updated.replace(/^N:.*;.*;.*;.*;/m, `N:${newName};;;;`);
          return updated + "\nEND:VCARD";
        });

        fs.writeFileSync(outputPath, newVcards.join("\n"));
        await bot.sendDocument(chatId, outputPath);
        await bot.sendMessage(chatId,
          `◆◆  RENAME SUKSES  ◆◆

┌─❖
│  ✅ Kontak berhasil direname
│
│  Nama baru: ${newName}
│
│  Total kontak: ${vcards.length}
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Rename error:", err);
        bot.sendMessage(chatId,
          `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  ⚠️ Rename gagal
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } finally {
        if (fs.existsSync(session.file)) fs.unlinkSync(session.file);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }

      delete sessions[userId];
    }
  });
}
