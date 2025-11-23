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

  bot.onText(/^⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️$|^⛓️ CREATE ADMIN ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  CREATE ADMIN  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    await trackMessage(userId, chatId, `◆◆  CREATE ADMIN  ◆◆

┌─❖
│  Buat File Admin
│
│  Format terstruktur VCF
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;
    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const numbers = text.split(/\s+/).filter(Boolean);
      if (numbers.length === 0) {
        return trackMessage(userId, chatId, `◆◆  CREATE ADMIN  ◆◆

┌─❖
│  ⚠️ Nomor tidak kosong
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      session.numbers = numbers;
      session.step = 2;
      return trackMessage(userId, chatId, `◆◆  CREATE ADMIN  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Ketik 'done' untuk proses
│  Ketik 'batal' untuk batalkan
└─❖`,  { parse_mode: "HTML" });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (/^done$/i.test(text)) {
        const filename = "ADMIN.vcf";
        const filepath = path.join(process.cwd(), filename);

        try {
          const content = session.numbers.map((num, i) => createVcfEntry(num, `ADMIN-${String(i + 1).padStart(4, "0")}`)).join("\n");
          fs.writeFileSync(filepath, content);

          await bot.sendDocument(chatId, filepath);
          await trackMessage(userId, chatId, `✅ File ADMIN.vcf berhasil dibuat Kak! 🎉\n\n👤 Total admin: ${session.numbers.length}\n\nSemoga membantu ya! 😊`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          bot.incrementOperation(userId);
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          delete sessions[userId];
        } catch (err) {
          console.error("Gagal:", err);
          delete sessions[userId];
          return sendWithDelete(userId, chatId, `⚠️ Yah… gagal buat file 😔`,  { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        }
      }
    }
  });

}
