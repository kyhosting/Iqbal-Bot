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

  bot.onText(/^⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ ⛓️$|^⛓️ HITUNG FILE ⛓️$|^\/hitungfile$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  HITUNG FILE  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    trackMessage(userId, chatId, `◆◆  HITUNG FILE  ◆◆

┌─❖
│  Hitung Kontak
│
│  Kirim file VCF/TXT
│
│  Ketik 'batal' untuk batal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return trackMessage(userId, chatId, `⚠️ Silakan kirim file VCF atau TXT Kak`, { parse_mode: "HTML" });
      }

      try {
        const fileName = msg.document.file_name || "file";
        const ext = fileName.split(".").pop().toLowerCase();

        if (!["vcf", "txt"].includes(ext)) {
          return trackMessage(userId, chatId, `❌ Format tidak didukung. Gunakan VCF atau TXT`, { parse_mode: "HTML" });
        }

        const fileId = msg.document.file_id;
        const filePath = await bot.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${bot.token}/${filePath.file_path}`;
        
        const response = await fetch(url);
        const content = await response.text();
        
        let contactCount = 0;
        if (ext === "vcf") {
          contactCount = (content.match(/BEGIN:VCARD/gi) || []).length;
        } else if (ext === "txt") {
          contactCount = (content.split("\n").filter(line => line.trim())).length;
        }

        bot.incrementOperation(userId);
        
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  HASIL HITUNG FILE  ◆◆

┌─❖
│  📊 Total Kontak: *${contactCount}*
│
│  Nama File: \`${fileName}\`
│  Format: ${ext.toUpperCase()}
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      } catch (err) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `❌ Error membaca file: ${err.message}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }
  });
}
