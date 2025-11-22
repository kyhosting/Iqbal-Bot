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

  bot.onText(/^⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ$|^\/createadmin$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ CREATE ADMIN\n\n▸ ◆◆ AKSES DITOLAK ◆◆

┌─❖
├ ❌ Akses Ditolak
├ Fitur khusus VIP
└─❖\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ CREATE ADMIN\n(Buat File Admin)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Buat daftar nomor admin\n▸ Format terstruktur\n\n▸ Masukkan nomor (spasi pisahkan)\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        return bot.sendMessage(chatId, "◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses dibatalkan</b>\n╰───────────────❖ ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const numbers = text.split(/\s+/).filter(Boolean);
      if (numbers.length === 0) {
        return bot.sendMessage(chatId, "⚠️ <b>Nomor tidak boleh kosong Kak</b> 😊\n\nCoba lagi ya!", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const filename = "ADMIN.vcf";
      const filepath = path.join(process.cwd(), filename);

      try {
        const content = numbers.map((num, i) => createVcfEntry(num, `ADMIN-${String(i + 1).padStart(4, "0")}`)).join("\n");
        fs.writeFileSync(filepath, content);

        bot.sendDocument(chatId, filepath).then(() => {
          bot.sendMessage(chatId, `✅ <b>File ADMIN.vcf berhasil dibuat Kak!</b> 🎉\n\n👤 <b>Total admin:</b> ${numbers.length}\n\nSemoga membantu ya! 😊`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          bot.incrementOperation(userId);
          fs.unlinkSync(filepath);
        }).catch((err) => {
          console.error("Gagal mengirim file:", err);
          bot.sendMessage(chatId, "⚠️ <b>Yah… gagal kirim file</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          try { fs.unlinkSync(filepath); } catch {}
        });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId, "⚠️ <b>Yah… gagal buat file VCF</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      delete sessions[userId];
    }
  });
}
