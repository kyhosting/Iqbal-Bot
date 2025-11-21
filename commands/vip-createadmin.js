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

  bot.onText(/^⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📨 *Buat File Admin*\n\nMasukkan daftar nomor admin ya Kak ✨\n\nPisahkan dengan spasi jika lebih dari satu\n\nKetik \`batal\` untuk membatalkan`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/createadmin$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📨 *Buat File Admin*\n\nMasukkan daftar nomor admin ya Kak ✨\n\nPisahkan dengan spasi jika lebih dari satu\n\nKetik \`batal\` untuk membatalkan`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;
    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const numbers = text.split(/\s+/).filter(Boolean);
      if (numbers.length === 0) {
        return bot.sendMessage(chatId, "⚠️ *Nomor tidak boleh kosong Kak* 😊\n\nCoba lagi ya!", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const filename = "ADMIN.vcf";
      const filepath = path.join(process.cwd(), filename);

      try {
        const content = numbers.map((num, i) => createVcfEntry(num, `ADMIN-${String(i + 1).padStart(4, "0")}`)).join("\n");
        fs.writeFileSync(filepath, content);

        bot.sendDocument(chatId, filepath).then(() => {
          bot.sendMessage(chatId, `✅ *File ADMIN.vcf berhasil dibuat Kak!* 🎉\n\n👤 *Total admin:* ${numbers.length}\n\nSemoga membantu ya! 😊`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
          bot.incrementOperation(userId);
          fs.unlinkSync(filepath);
        }).catch((err) => {
          console.error("Gagal mengirim file:", err);
          bot.sendMessage(chatId, "⚠️ *Yah… gagal kirim file* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
          try { fs.unlinkSync(filepath); } catch {}
        });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId, "⚠️ *Yah… gagal buat file VCF* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      delete sessions[userId];
    }
  });
}
