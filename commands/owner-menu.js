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
      return bot.sendMessage(
        chatId, 
        `◆◆ MENU OWNER ◆◆\n\n┌─❖\n├ ❌ Menu ini hanya untuk owner\n└─❖`,
        { 
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: "➕ Buat Kode", callback_data: "owner_create_code" },
          { text: "📋 Lihat Kode", callback_data: "owner_list_codes" }
        ],
        [
          { text: "🗑️ Hapus Kode", callback_data: "owner_delete_code" },
          { text: "👥 Lihat User", callback_data: "owner_list_users" }
        ],
        [
          { text: "📢 Broadcast", callback_data: "owner_broadcast" },
          { text: "📊 All Users", callback_data: "owner_all_users" }
        ],
        [
          { text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }
        ]
      ]
    };

    bot.sendMessage(
      chatId,
      `◆◆ PANEL ADMIN AKTIF ◆◆\n\n┌─❖\n├ 🛡️ Management Panel\n├ Pilih menu yang ingin digunakan\n└─❖`,
      { 
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  });

  bot.onText(/^\/owner$/, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId, 
        `◆◆ MENU OWNER ◆◆\n\n┌─❖\n├ ❌ Khusus owner\n└─❖`,
        { 
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: "➕ Buat Kode", callback_data: "owner_create_code" },
          { text: "📋 Lihat Kode", callback_data: "owner_list_codes" }
        ],
        [
          { text: "🗑️ Hapus Kode", callback_data: "owner_delete_code" },
          { text: "👥 Lihat User", callback_data: "owner_list_users" }
        ],
        [
          { text: "📢 Broadcast", callback_data: "owner_broadcast" },
          { text: "📊 All Users", callback_data: "owner_all_users" }
        ],
        [
          { text: "🎁 Set VIP Manual", callback_data: "owner_set_vip" }
        ]
      ]
    };

    bot.sendMessage(
      chatId,
      `◆◆ PANEL ADMIN AKTIF ◆◆\n\n┌─❖\n├ 🛡️ Management Panel\n├ Pilih menu yang ingin digunakan\n└─❖`,
      { 
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner") {
      return bot.answerCallbackQuery(query.id, { text: "Khusus owner!" });
    }

    if (data === "owner_list_codes") {
      const codes = Object.keys(bot.redeemDB);
      if (codes.length === 0) {
        bot.answerCallbackQuery(query.id, { text: "Belum ada kode" });
        return bot.sendMessage(
          chatId,
          `◆◆ DAFTAR KODE REDEEM ◆◆\n\n┌─❖\n├ 📋 Status\n├ Belum ada kode yang dibuat\n└─❖`,
          { parse_mode: "HTML" }
        );
      }

      let message = `◆◆ DAFTAR KODE REDEEM (${codes.length}) ◆◆\n\n`;
      codes.forEach((code, i) => {
        const r = bot.redeemDB[code];
        const status = r.used_by ? "✅ Terpakai" : "⏳ Aktif";
        const exp = r.expires_at ? new Date(r.expires_at).toLocaleDateString('id-ID') : "Permanent";
        message += `┌─❖ ${i + 1}\n├ Kode: ${code}\n├ Status: ${status}\n├ Durasi: ${r.duration} hari\n├ Expired: ${exp}\n└─❖\n`;
      });

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    if (data === "owner_list_users") {
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      
      let message = `◆◆ STATISTIK USER ◆◆\n\n┌─❖\n├ 📊 Total Statistik\n├ Total User: ${users.length}\n├ VIP Aktif: ${vipUsers.length}\n├ User Biasa: ${users.length - vipUsers.length}\n└─❖\n\n`;
      
      if (vipUsers.length > 0) {
        message += `┌─❖\n├ 💎 VIP Users (${vipUsers.length})\n`;
        vipUsers.slice(0, 10).forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString('id-ID');
          message += `├ ${i + 1}. ${u.first_name} (@${u.username || 'no-username'})\n├    Expired: ${exp}\n`;
        });
        if (vipUsers.length > 10) {
          message += `├ ... dan ${vipUsers.length - 10} user VIP lainnya\n`;
        }
        message += `└─❖`;
      }

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    if (data === "owner_all_users") {
      bot.answerCallbackQuery(query.id);
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      const normalUsers = users.filter(u => u.role === "user" || (u.role === "vip" && u.vip_expired <= Date.now()));

      if (users.length === 0) {
        return bot.sendMessage(chatId, `◆◆ DAFTAR USER ◆◆\n\n┌─❖\n├ ❌ Belum ada user\n└─❖`, { parse_mode: "HTML" });
      }

      let message = `◆◆ DAFTAR SEMUA USER ◆◆\n\n┌─❖\n├ 📊 Total Overview\n├ Total: ${users.length} user\n├ VIP Aktif: ${vipUsers.length}\n├ Normal: ${normalUsers.length}\n└─❖\n\n`;

      if (vipUsers.length > 0) {
        message += `┌─❖\n├ 💎 VIP Users (${vipUsers.length})\n`;
        vipUsers.forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString("id-ID");
          message += `├ ${i + 1}. ${u.first_name || 'Unknown'}\n├    🆔 ${u.id} | ⏳ ${exp}\n`;
        });
        message += `└─❖\n\n`;
      }

      if (normalUsers.length > 0) {
        message += `┌─❖\n├ 👤 Normal Users (${normalUsers.length})\n`;
        normalUsers.slice(0, 20).forEach((u, i) => {
          message += `├ ${vipUsers.length + i + 1}. ${u.first_name || 'Unknown'}\n├    🆔 ${u.id}\n`;
        });
        if (normalUsers.length > 20) {
          message += `├ ... dan ${normalUsers.length - 20} user lainnya\n`;
        }
        message += `└─❖`;
      }

      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    if (data === "owner_broadcast") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "broadcast_message" };
      bot.sendMessage(
        chatId,
        `◆◆ KIRIM BROADCAST ◆◆\n\n┌─❖\n├ 📢 Input Message\n├ Ketik pesan yang ingin dikirim\n├ Ketik 'batal' untuk membatalkan\n└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (data === "owner_create_code") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "create_code_duration" };
      bot.sendMessage(
        chatId,
        `◆◆ BUAT KODE REDEEM ◆◆\n\n┌─❖\n├ ➕ Input Durasi\n├ Masukkan durasi VIP (hari)\n├ Contoh: 30\n├ Ketik 'batal' untuk membatalkan\n└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (data === "owner_delete_code") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `◆◆ HAPUS KODE REDEEM ◆◆\n\n┌─❖\n├ 🗑️ Format Command\n├ /deletecode KODE\n├ Contoh: /deletecode VIP123\n└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (data === "owner_set_vip") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `◆◆ SET VIP MANUAL ◆◆\n\n┌─❖\n├ 🎁 Format Command\n├ /setvip USER_ID DURASI_HARI\n├ Contoh: /setvip 123456789 30\n└─❖`,
        { parse_mode: "HTML" }
      );
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
        return bot.sendMessage(chatId, `◆◆ DIBATALKAN ◆◆\n\n┌─❖\n├ ❌ Proses dibatalkan\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ⚠️ Durasi harus angka\n├ Contoh: 30\n└─❖`, { parse_mode: "HTML" });
      }

      sessions[userId].step = "create_code_expiry";
      sessions[userId].duration = duration;
      return bot.sendMessage(chatId, `◆◆ BUAT KODE REDEEM ◆◆\n\n┌─❖\n├ ➕ Input Tanggal Expired\n├ Format: YYYY-MM-DD\n├ Contoh: 2025-12-31\n├ Ketik 'batal' untuk membatalkan\n└─❖`, { parse_mode: "HTML" });
    }

    if (session && session.step === "create_code_expiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `◆◆ DIBATALKAN ◆◆\n\n┌─❖\n├ ❌ Proses dibatalkan\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const expiry = text.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ⚠️ Format salah\n├ Gunakan: YYYY-MM-DD\n├ Contoh: 2025-12-31\n└─❖`, { parse_mode: "HTML" });
      }

      const randomCode = generateRandomCode();
      const duration = sessions[userId].duration;
      const expiryDate = new Date(expiry);

      if (bot.redeemDB[randomCode]) {
        return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ⚠️ Kode sudah ada\n├ Coba lagi\n└─❖`, { parse_mode: "HTML" });
      }

      bot.redeemDB[randomCode] = {
        code: randomCode,
        type: "vip",
        duration: duration,
        expires_at: expiryDate.toISOString(),
        created_at: new Date().toISOString(),
        used_by: null
      };

      bot.saveRedeemDB();

      bot.sendMessage(chatId, `◆◆ KODE BERHASIL DIBUAT ◆◆\n\n┌─❖\n├ ✅ Random Code\n├ Kode: ${randomCode}\n├ Durasi: ${duration} hari\n├ Expired: ${expiryDate.toLocaleDateString('id-ID')}\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      delete sessions[userId];
    }

    if (!session || session.step !== "broadcast_message") return;

    if (/^batal$/i.test(text)) {
      delete sessions[userId];
      return bot.sendMessage(chatId, `◆◆ DIBATALKAN ◆◆\n\n┌─❖\n├ ❌ Broadcast dibatalkan\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    try {
      const users = Object.values(db.users);
      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await bot.sendMessage(user.id, `📢 Broadcast dari Owner\n\n${text}`, { reply_markup: bot.getMainKeyboardUser(userId) });
          success++;
        } catch (err) {
          failed++;
        }
      }

      bot.sendMessage(chatId, `◆◆ BROADCAST SELESAI ◆◆\n\n┌─❖\n├ ✅ Berhasil: ${success}\n├ ❌ Gagal: ${failed}\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      delete sessions[userId];
    } catch (err) {
      bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ❌ Broadcast gagal\n└─❖`, { parse_mode: "HTML" });
      delete sessions[userId];
    }
  });

  bot.onText(/^\/createcode (.+) (\d+) (.+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ❌ Khusus owner\n└─❖`, { parse_mode: "HTML" });
    }

    const code = match[1].toUpperCase();
    const duration = parseInt(match[2]);
    const expiresAt = match[3];

    if (bot.redeemDB[code]) {
      return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ⚠️ Kode ${code} sudah ada\n└─❖`, { parse_mode: "HTML" });
    }

    bot.redeemDB[code] = {
      code: code,
      type: "vip",
      duration: duration,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    bot.saveRedeemDB();

    bot.sendMessage(chatId, `◆◆ KODE BERHASIL DIBUAT ◆◆\n\n┌─❖\n├ ✅ Manual Code\n├ Kode: ${code}\n├ Durasi: ${duration} hari\n├ Expired: ${expiresAt}\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.onText(/^\/deletecode (.+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ❌ Khusus owner\n└─❖`, { parse_mode: "HTML" });
    }

    const code = match[1].toUpperCase();

    if (!bot.redeemDB[code]) {
      return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ⚠️ Kode ${code} tidak ditemukan\n└─❖`, { parse_mode: "HTML" });
    }

    delete bot.redeemDB[code];
    bot.saveRedeemDB();

    bot.sendMessage(chatId, `◆◆ KODE DIHAPUS ◆◆\n\n┌─❖\n├ ✅ Kode: ${code}\n├ Status: Tidak Berlaku\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.onText(/^\/setvip (\d+) (\d+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, `◆◆ ERROR ◆◆\n\n┌─❖\n├ ❌ Khusus owner\n└─❖`, { parse_mode: "HTML" });
    }

    const targetUserId = parseInt(match[1]);
    const durationDays = parseInt(match[2]);

    if (!db.users[targetUserId]) {
      db.users[targetUserId] = {
        id: targetUserId,
        username: "",
        first_name: "User",
        last_name: "",
        role: "vip",
        vip_expired: Date.now() + durationDays * 24 * 60 * 60 * 1000,
        status: "active",
        total_operation: 0
      };
    } else {
      db.users[targetUserId].role = "vip";
      db.users[targetUserId].vip_expired = Date.now() + durationDays * 24 * 60 * 60 * 1000;
      db.users[targetUserId].status = "active";
    }

    saveDB();

    const expireDate = new Date(db.users[targetUserId].vip_expired).toLocaleDateString('id-ID');
    bot.sendMessage(chatId, `◆◆ VIP BERHASIL DIBERIKAN ◆◆\n\n┌─❖\n├ ✅ VIP Manual\n├ User: ${targetUserId}\n├ Durasi: ${durationDays} hari\n├ Expired: ${expireDate}\n└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });
}
