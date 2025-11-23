function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function parseDuration(str) {
  const match = str.match(/^(\d+)([mhdw])$/i);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    'm': 60 * 1000,              // menit ke ms
    'h': 60 * 60 * 1000,         // jam ke ms
    'd': 24 * 60 * 60 * 1000,    // hari ke ms
    'w': 7 * 24 * 60 * 60 * 1000 // minggu ke ms
  };
  
  return value * multipliers[unit];
}

function formatDuration(ms) {
  if (ms < 60 * 1000) {
    return Math.floor(ms / 1000) + "s";
  } else if (ms < 60 * 60 * 1000) {
    return Math.floor(ms / (60 * 1000)) + "m";
  } else if (ms < 24 * 60 * 60 * 1000) {
    return Math.floor(ms / (60 * 60 * 1000)) + "h";
  } else {
    return Math.floor(ms / (24 * 60 * 60 * 1000)) + "d";
  }
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

  async function showOwnerMenu(userId, chatId, isFromBatal = false) {
    const keyboard = {
      inline_keyboard: [
        [{ text: "➕ Buat Kode", callback_data: "owner_create_code" }, { text: "📋 Lihat Kode", callback_data: "owner_list_codes" }],
        [{ text: "🗑️ Hapus Kode", callback_data: "owner_delete_code" }, { text: "👥 Lihat User", callback_data: "owner_list_users" }],
        [{ text: "📢 Broadcast", callback_data: "owner_broadcast" }, { text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }],
        [{ text: "◀️ Kembali ke Menu Biasa", callback_data: "kembali_menu_biasa" }]
      ]
    };

    const text = `◆◆  PANEL ADMIN AKTIF  ◆◆

┌─❖
│  🛡️ Management Panel
│
│  Pilih menu yang ingin digunakan
└─❖`;

    if (isFromBatal) {
      return sendWithDelete(userId, chatId, text, { parse_mode: "Markdown", reply_markup: keyboard });
    } else {
      const msg = await bot.sendMessage(chatId, text, { parse_mode: "Markdown", reply_markup: keyboard });
      userMessages[userId] = msg.message_id;
      return msg;
    }
  }

  async function showMainMenu(userId, chatId, isFromBatal = false) {
    const text = `◆◆  MENU UTAMA  ◆◆

┌─❖
│  🎯 Pilih menu untuk melanjutkan
└─❖`;

    if (isFromBatal) {
      return sendWithDelete(userId, chatId, text, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
    } else {
      const msg = await bot.sendMessage(chatId, text, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) });
      userMessages[userId] = msg.message_id;
      return msg;
    }
  }

  bot.onText(/^⛓️ MENU OWNER ⛓️$|^\/owner$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return bot.sendMessage(
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk owner kak!
└─❖`,
        { parse_mode: "Markdown" }
      );
    }

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId,
        `◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Menu ini hanya untuk owner
└─❖`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    await showOwnerMenu(userId, chatId, false);
  });

  bot.onText(/^\/owner$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return bot.sendMessage(
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk owner kak!
└─❖`,
        { parse_mode: "Markdown" }
      );
    }

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId,
        `◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Khusus owner
└─❖`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    await showOwnerMenu(userId, chatId, false);
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner" && data !== "kembali_menu_biasa") {
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
          const expTime = formatDuration(r.expires_in_ms);
          message += `│  ${i + 1}. ${code}\n`;
          message += `│     Status: ${status}\n`;
          message += `│     Durasi VIP: ${r.duration} hari\n`;
          message += `│     Code Expired: ${expTime}\n`;
          if (i < codes.length - 1) message += `│\n`;
        });
        message += `└─❖`;
      }

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parse_mode: "Markdown", reply_markup: backKeyboard });
    }

    // CREATE CODE
    else if (data === "owner_create_code") {
      sessions[userId] = { step: "create_code_name" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  BUAT KODE  ◆◆

┌─❖
│  📝 Masukkan nama kode
│
│  Contoh: VIPCODE001
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
    }

    // DELETE CODE
    else if (data === "owner_delete_code") {
      sessions[userId] = { step: "delete_code" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  HAPUS KODE  ◆◆

┌─❖
│  📝 Masukkan kode yang ingin dihapus
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
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

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parse_mode: "Markdown", reply_markup: backKeyboard });
    }

    // BROADCAST
    else if (data === "owner_broadcast") {
      sessions[userId] = { step: "broadcast_message" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  BROADCAST KE SEMUA USER  ◆◆

┌─❖
│  📢 Masukkan pesan broadcast
│
│  Pesan akan dikirim ke semua user
│  Bisa pakai emoji, bold, italic
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
    }

    // SET VIP MANUAL
    else if (data === "owner_set_vip") {
      sessions[userId] = { step: "setvip_userid" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  SET VIP MANUAL  ◆◆

┌─❖
│  👤 Masukkan User ID
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
    }

    // BACK TO OWNER MENU
    else if (data === "owner_back_menu") {
      await bot.answerCallbackQuery(query.id);
      delete sessions[userId];
      await showOwnerMenu(userId, chatId, false);
    }

    // BACK TO MAIN MENU (Keyboard Buttons)
    else if (data === "kembali_menu_biasa") {
      await bot.answerCallbackQuery(query.id);
      delete sessions[userId];
      await showMainMenu(userId, chatId, false);
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
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      sessions[userId].code_name = text.toUpperCase();
      sessions[userId].step = "create_code_duration";
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Contoh: 7, 30, 365
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
      return;
    }

    // CREATE CODE - DURATION
    else if (session.step === "create_code_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        const msg = await bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖`, { parse_mode: "Markdown" });
        userMessages[userId] = msg.message_id;
        return;
      }
      sessions[userId].duration = duration;
      sessions[userId].step = "create_code_expiry";
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  CODE EXPIRED DURATION  ◆◆

┌─❖
│  ⏰ Kapan code ini kadaluarsa?
│
│  Format: <angka><satuan>
│  
│  Satuan:
│  • m = menit (contoh: 5m)
│  • h = jam (contoh: 1h)
│  • d = hari (contoh: 7d)
│  • w = minggu (contoh: 2w)
│
│  Contoh: 7d, 1h, 30m
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
      return;
    }

    // CREATE CODE - EXPIRY
    else if (session.step === "create_code_expiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      
      const expiryMs = parseDuration(text);
      if (!expiryMs) {
        const msg = await bot.sendMessage(
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ⚠️ Format salah!
│
│  Contoh yang benar:
│  5m, 1h, 7d, 2w
└─❖`,
          { parse_mode: "Markdown" }
        );
        userMessages[userId] = msg.message_id;
        return;
      }

      const code = session.code_name;
      bot.redeemDB[code] = {
        code,
        duration: session.duration,
        expires_in_ms: expiryMs,
        created_at: Date.now(),
        used_by: null
      };
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        `◆◆  KODE DIBUAT  ◆◆

┌─❖
│  ✅ Kode berhasil dibuat
│
│  Kode: <code>${code}</code>
│  Durasi VIP: ${session.duration} hari
│  Code Expired: ${formatDuration(expiryMs)}
└─❖`,
        { parse_mode: "Markdown", reply_markup: backKeyboard }
      );
    }

    // DELETE CODE
    else if (session.step === "delete_code") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const code = text.toUpperCase();
      if (!bot.redeemDB[code]) {
        const msg = await bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Kode tidak ditemukan!\n└─❖`, { parse_mode: "Markdown" });
        userMessages[userId] = msg.message_id;
        return;
      }

      delete bot.redeemDB[code];
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        `◆◆  KODE DIHAPUS  ◆◆

┌─❖
│  ✅ Kode berhasil dihapus
│
│  Kode: <code>${code}</code>
└─❖`,
        { parse_mode: "Markdown", reply_markup: backKeyboard }
      );
    }

    // BROADCAST
    else if (session.step === "broadcast_message") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const allUsers = Object.values(db.users);
      const broadcastMsg = `◆◆  BROADCAST  ◆◆

┌─❖

${text}

└─❖`;

      let sent = 0;
      let failed = 0;

      for (const user of allUsers) {
        try {
          await bot.sendMessage(user.id, broadcastMsg, { parse_mode: "Markdown" });
          sent++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          failed++;
        }
      }

      delete sessions[userId];

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        `◆◆  BROADCAST SELESAI  ◆◆

┌─❖
│  ✅ Broadcast berhasil dikirim
│
│  Terkirim: ${sent} user
│  Gagal: ${failed} user
└─❖`,
        { parse_mode: "Markdown", reply_markup: backKeyboard }
      );
    }

    // SET VIP - USERID
    else if (session.step === "setvip_userid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        const msg = await bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ User ID harus angka!\n└─❖`, { parse_mode: "Markdown" });
        userMessages[userId] = msg.message_id;
        return;
      }

      sessions[userId].target_user_id = targetUserId;
      sessions[userId].step = "setvip_duration";
      const msg = await bot.sendMessage(
        chatId,
        `◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Ketik 'batal' untuk cancel
└─❖`,
        { parse_mode: "Markdown" }
      );
      userMessages[userId] = msg.message_id;
      return;
    }

    // SET VIP - DURATION
    else if (session.step === "setvip_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        const msg = await bot.sendMessage(chatId, `◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖`, { parse_mode: "Markdown" });
        userMessages[userId] = msg.message_id;
        return;
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

      const backKeyboard = {
        inline_keyboard: [
          [{ text: "◀️ Kembali ke Menu", callback_data: "owner_back_menu" }]
        ]
      };

      const expDate = new Date(db.users[targetUserId].vip_expired).toLocaleDateString("id-ID");
      await bot.sendMessage(
        chatId,
        `◆◆  VIP DISET  ◆◆

┌─❖
│  ✅ VIP berhasil diset
│
│  User ID: ${targetUserId}
│  Durasi: ${duration} hari
│  Expired: ${expDate}
└─❖`,
        { parse_mode: "Markdown", reply_markup: backKeyboard }
      );
    }
  });
}
