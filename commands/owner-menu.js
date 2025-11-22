function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function (bot, db, saveDB) {
  const sessions = {};
  
  if (!bot.saveRedeemDB) {
    bot.saveRedeemDB = () => {
      const fs = require("fs");
      fs.writeFileSync("redeem.json", JSON.stringify(bot.redeemDB, null, 2));
    };
  }
  
  bot.onText(/^⛓️MENU OWNER$/i, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, 
        `◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Menu ini hanya untuk owner
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: "➕ Buat Kode", callback_data: "owner_create_code" }, { text: "📋 Lihat Kode", callback_data: "owner_list_codes" }],
        [{ text: "🗑️ Hapus Kode", callback_data: "owner_delete_code" }, { text: "👥 Lihat User", callback_data: "owner_list_users" }],
        [{ text: "📢 Broadcast", callback_data: "owner_broadcast" }, { text: "📊 All Users", callback_data: "owner_all_users" }],
        [{ text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }]
      ]
    };

    bot.sendMessage(chatId,
      `◆◆  PANEL ADMIN AKTIF  ◆◆

┌─❖
│  🛡️ Management Panel
│
│  Pilih menu yang ingin digunakan
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  });

  bot.onText(/^\/owner$/, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, 
        `◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Khusus owner
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: "➕ Buat Kode", callback_data: "owner_create_code" }, { text: "📋 Lihat Kode", callback_data: "owner_list_codes" }],
        [{ text: "🗑️ Hapus Kode", callback_data: "owner_delete_code" }, { text: "👥 Lihat User", callback_data: "owner_list_users" }],
        [{ text: "📢 Broadcast", callback_data: "owner_broadcast" }, { text: "📊 All Users", callback_data: "owner_all_users" }],
        [{ text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }]
      ]
    };

    bot.sendMessage(chatId,
      `◆◆  PANEL ADMIN AKTIF  ◆◆

┌─❖
│  🛡️ Management Panel
│
│  Pilih menu yang ingin digunakan
│
│  Ketik 'done' untuk selesai
│  Ketik 'batal' untuk batal
└─❖`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner") {
      return bot.answerCallbackQuery(query.id, { text: "❌ Khusus owner!" });
    }

    if (data === "owner_list_codes") {
      const codes = Object.keys(bot.redeemDB);
      let message = `◆◆  DAFTAR KODE (${codes.length})  ◆◆\n\n┌─❖\n`;
      codes.forEach((code, i) => {
        const r = bot.redeemDB[code];
        const status = r.used_by ? "✅ Terpakai" : "⏳ Aktif";
        message += `│  ${i + 1}. ${code} | ${status} | ${r.duration}h\n`;
      });
      message += `└─❖`;
      
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }
  });

  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];

    if (session && session.step === "create_code_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, 
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka!\n└─❖`, { parse_mode: "HTML" });
      sessions[userId].step = "create_code_expiry";
      sessions[userId].duration = duration;
      return bot.sendMessage(chatId, 
        `◆◆  INPUT EXPIRED DATE  ◆◆

┌─❖
│  Format: YYYY-MM-DD
│
│  Contoh: 2025-12-31
└─❖`,
        { parse_mode: "HTML" }
      );
    }
  });
}
