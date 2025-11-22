import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ$|^\/hitungfile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId,
        `◆◆  HITUNG FILE  ◆◆

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
      `◆◆  HITUNG FILE  ◆◆

┌─❖
│  Count Contacts
│
│  Support Format: TXT, VCF
│
│  Hitung total kontak/nomor
│
│  Kirim file untuk start
│
│  Ketik 'batal' batalkan
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

      if (!msg.document) {
        return bot.sendMessage(chatId,
          `◆◆  HITUNG FILE  ◆◆

┌─❖
│  ⚠️ Kirim file dulu
│
│  Support: TXT atau VCF
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const fileName = msg.document.file_name;
      const isTXT = fileName.endsWith(".txt");
      const isVCF = fileName.endsWith(".vcf");

      if (!isTXT && !isVCF) {
        return bot.sendMessage(chatId,
          `◆◆  HITUNG FILE  ◆◆

┌─❖
│  ⚠️ Hanya TXT atau VCF
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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

        delete sessions[userId];
        await bot.sendMessage(chatId,
          `◆◆  HASIL HITUNG  ◆◆

┌─❖
│  📂 File: ${fileName}
│
│  📊 Total: ${count}
│
│  ✓ Unik: ${unique}
│
│  Type: ${isTXT ? "TXT" : "VCF"}
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Count error:", err);
        delete sessions[userId];
        bot.sendMessage(chatId,
          `◆◆  HITUNG FILE  ◆◆

┌─❖
│  ⚠️ Hitung gagal
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      } finally {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    }
  });
}
