import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button & /msgtotxt command
  bot.onText(/^⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ$|^\/msgtotxt$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ MSG TO TXT\n\n▸ ◆◆ AKSES DITOLAK ◆◆

┌─❖
├ ❌ Akses Ditolak
├ Fitur khusus VIP
└─❖\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ MSG TO TXT\n(Message to File)\n\n▸ Support Format:\n  • Text\n  • Nomor/Data\n\n▸ Kirim teks atau nomor\n▸ Simpan jadi file TXT\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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

      session.content = text;
      session.step = 2;
      return bot.sendMessage(chatId, `📝 <b>Masukkan nama file baru ya Kak</b>\n\nTanpa ekstensi .txt\n\nKetik \`batal\` untuk membatalkan.`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses dibatalkan</b>\n╰───────────────❖ ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const filename = text.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";
      const filepath = path.join(process.cwd(), filename);

      try {
        fs.writeFileSync(filepath, session.content);

        bot.sendDocument(chatId, filepath, {}, { filename }).then(() => {
          bot.sendMessage(chatId, `✅ <b>File TXT berhasil dibuat Kak!</b> 🎉\n\n📂 <b>File:</b> \`${filename}\`\n\nSemoga membantu ya! 😊`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          bot.incrementOperation(userId);
          fs.unlinkSync(filepath);
        }).catch((err) => {
          console.error("Gagal kirim file:", err);
          bot.sendMessage(chatId, "⚠️ <b>Yah… ada masalah saat kirim file</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          try { fs.unlinkSync(filepath); } catch {}
        });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId, "⚠️ <b>Yah… gagal buat file TXT</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      delete sessions[userId];
    }
  });
}
