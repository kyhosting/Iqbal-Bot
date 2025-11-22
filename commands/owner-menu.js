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

  bot.onText(/^⛓️MENU OWNER$/i, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId,
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
        [{ text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }]
      ]
    };

    bot.sendMessage(
      chatId,
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
      return bot.sendMessage(
        chatId,
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
        [{ text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }]
      ]
    };

    bot.sendMessage(
      chatId,
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

    // LIST CODES
    if (data === "owner_list_codes") {
      const codes = Object.keys(bot.redeemDB);
      let message = `◆◆  DAFTAR KODE (${codes.length})  ◆◆\n\n`;
      if (codes.length === 0) {
        message += `┌─❖\n│  ℹ️ Belum ada kode\n└─❖`;
      } else {
        message += `┌─❖\n`;
        codes.forEach((code, i) => {
          const r = bot.redeemDB[code];
          const status = r.used_by ? "✅ Terpakai" : "⏳ Aktif";
          message += `│  ${i + 1}. ${code}\n`;
          message += `│     Status: ${status}\n`;
          message += `│     Durasi: ${r.duration} hari\n`;
          message += `│     Exp: ${r.expired}\n`;
          if (i < codes.length - 1) message += `│\n`;
        });
        message += `└─❖`;
      }

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // CREATE CODE
    else if (data === "owner_create_code") {
      sessions[userId] = { step: "create_code_name" };
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(
        chatId,
        `◆◆  BUAT KODE  ◆◆

┌─❖
│  📝 Masukkan nama kode
│
│  Contoh: VIPCODE001
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // DELETE CODE
    else if (data === "owner_delete_code") {
      sessions[userId] = { step: "delete_code" };
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(
        chatId,
        `◆◆  HAPUS KODE  ◆◆

┌─❖
│  📝 Masukkan kode yang ingin dihapus
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // LIST USERS
    else if (data === "owner_list_users") {
      const vipUsers = Object.values(db.users).filter((u) => u.role === "vip" && u.vip_expired > Date.now());
      let message = `◆◆  DAFTAR VIP USER (${vipUsers.length})  ◆◆\n\n`;
      if (vipUsers.length === 0) {
        message += `┌─❖\n│  ℹ️ Belum ada user VIP\n└─❖`;
      } else {
        message += `┌─❖\n`;
        vipUsers.forEach((user, i) => {
          const exp = new Date(user.vip_expired).toLocaleDateString("id-ID");
          message += `│  ${i + 1}. ${user.first_name}\n`;
          message += `│     ID: ${user.id}\n`;
          message += `│     Exp: ${exp}\n`;
          if (i < vipUsers.length - 1) message += `│\n`;
        });
        message += `└─❖`;
      }

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // SET VIP MANUAL
    else if (data === "owner_set_vip") {
      sessions[userId] = { step: "setvip_userid" };
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(
        chatId,
        `◆◆  SET VIP MANUAL  ◆◆

┌─❖
│  👤 Masukkan User ID
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }
  });

  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];

    if (!session) return;

    // CREATE CODE - NAME
    if (session.step === "create_code_name") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }
      sessions[userId].code_name = text.toUpperCase();
      sessions[userId].step = "create_code_duration";
      return bot.sendMessage(
        chatId,
        `◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Contoh: 7, 30, 365
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // CREATE CODE - DURATION
    else if (session.step === "create_code_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆  DIBATALKAN  ◆◆\n\n┌─❖\n│  ❌ Dibatalkan\n└─❖`, { parse_mode: "HTML" });
      }
      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖`, { parse_mode: "HTML" });
      }
      sessions[userId].duration = duration;
      sessions[userId].step = "create_code_expiry";
      return bot.sendMessage(
        chatId,
        `◆◆  TANGGAL EXPIRED  ◆◆

┌─❖
│  📅 Format: YYYY-MM-DD
│
│  Contoh: 2025-12-31
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // CREATE CODE - EXPIRY
    else if (session.step === "create_code_expiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆  DIBATALKAN  ◆◆\n\n┌─❖\n│  ❌ Dibatalkan\n└─❖`, { parse_mode: "HTML" });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Format harus YYYY-MM-DD!\n└─❖`, { parse_mode: "HTML" });
      }

      const code = session.code_name;
      bot.redeemDB[code] = {
        code,
        duration: session.duration,
        expired: text,
        used_by: null
      };
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];
      return bot.sendMessage(
        chatId,
        `◆◆  KODE DIBUAT  ◆◆

┌─❖
│  ✅ Kode berhasil dibuat
│
│  Kode: ${code}
│  Durasi: ${session.duration} hari
│  Expired: ${text}
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // DELETE CODE
    else if (session.step === "delete_code") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆  DIBATALKAN  ◆◆\n\n┌─❖\n│  ❌ Dibatalkan\n└─❖`, { parse_mode: "HTML" });
      }

      const code = text.toUpperCase();
      if (!bot.redeemDB[code]) {
        return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Kode tidak ditemukan!\n└─❖`, { parse_mode: "HTML" });
      }

      delete bot.redeemDB[code];
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];
      return bot.sendMessage(
        chatId,
        `◆◆  KODE DIHAPUS  ◆◆

┌─❖
│  ✅ Kode berhasil dihapus
│
│  Kode: ${code}
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // SET VIP - USERID
    else if (session.step === "setvip_userid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆  DIBATALKAN  ◆◆\n\n┌─❖\n│  ❌ Dibatalkan\n└─❖`, { parse_mode: "HTML" });
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ User ID harus angka!\n└─❖`, { parse_mode: "HTML" });
      }

      sessions[userId].target_user_id = targetUserId;
      sessions[userId].step = "setvip_duration";
      return bot.sendMessage(
        chatId,
        `◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // SET VIP - DURATION
    else if (session.step === "setvip_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆  DIBATALKAN  ◆◆\n\n┌─❖\n│  ❌ Dibatalkan\n└─❖`, { parse_mode: "HTML" });
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        return bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖`, { parse_mode: "HTML" });
      }

      const targetUserId = session.target_user_id;
      if (!db.users[targetUserId]) {
        db.users[targetUserId] = {
          id: targetUserId,
          username: "unknown",
          first_name: "User",
          last_name: "",
          role: "vip",
          vip_expired: Date.now() + duration * 24 * 60 * 60 * 1000,
          status: "active",
          total_operation: 0
        };
      } else {
        db.users[targetUserId].role = "vip";
        db.users[targetUserId].vip_expired = Date.now() + duration * 24 * 60 * 60 * 1000;
        db.users[targetUserId].status = "active";
      }
      saveDB();

      delete sessions[userId];
      const expDate = new Date(db.users[targetUserId].vip_expired).toLocaleDateString("id-ID");
      return bot.sendMessage(
        chatId,
        `◆◆  VIP DISET  ◆◆

┌─❖
│  ✅ VIP berhasil diset
│
│  User ID: ${targetUserId}
│  Durasi: ${duration} hari
│  Expired: ${expDate}
└─❖`,
        { parse_mode: "HTML" }
      );
    }
  });
}
