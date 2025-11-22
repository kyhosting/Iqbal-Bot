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
  
  // Make sure bot has saveRedeemDB method
  if (!bot.saveRedeemDB) {
    bot.saveRedeemDB = () => {
      const fs = require("fs");
      fs.writeFileSync("redeem.json", JSON.stringify(bot.redeemDB, null, 2));
    };
  }
  
  // Handle keyboard button "⛓️MENU OWNER"
  bot.onText(/^⛓️MENU OWNER$/i, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId, 
        "❌ <b>Menu ini hanya untuk owner ya Kak</b> 😊",
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
      `🛡️ <b>Panel Admin Aktif</b>\n\n` +
      `Silakan pilih menu yang ingin digunakan ya Kak:`,
      { 
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  });

  // Handle /owner command
  bot.onText(/^\/owner$/, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId, 
        "❌ <b>Khusus owner</b> 😊",
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
      `🛡️ <b>Panel Admin Aktif</b>\n\n` +
      `Silakan pilih menu yang ingin digunakan ya Kak:`,
      { 
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  });

  // Handle callback queries
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner") {
      return bot.answerCallbackQuery(query.id, { text: "Khusus owner!" });
    }

    // List codes
    if (data === "owner_list_codes") {
      const codes = Object.keys(bot.redeemDB);
      if (codes.length === 0) {
        bot.answerCallbackQuery(query.id, { text: "Belum ada kode" });
        return bot.sendMessage(
          chatId,
          "📋 <b>Daftar Kode Redeem</b>\n\nBelum ada kode redeem yang dibuat.",
          { parse_mode: "HTML" }
        );
      }

      let message = `📋 <b>Daftar Kode Redeem</b> (${codes.length} kode)\n\n`;
      codes.forEach((code, i) => {
        const r = bot.redeemDB[code];
        const status = r.used_by ? "✅ Terpakai" : "⏳ Aktif";
        const exp = r.expires_at ? new Date(r.expires_at).toLocaleDateString('id-ID') : "Permanent";
        message += `${i + 1}. <code>${code}</code>\n`;
        message += `   Status: ${status}\n`;
        message += `   Durasi: ${r.duration} hari\n`;
        message += `   Expired: ${exp}\n\n`;
      });

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // List users
    if (data === "owner_list_users") {
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      
      let message = `👥 <b>Statistik User</b>\n\n`;
      message += `📊 Total User: ${users.length}\n`;
      message += `💎 VIP Aktif: ${vipUsers.length}\n`;
      message += `👤 User Biasa: ${users.length - vipUsers.length}\n\n`;
      
      if (vipUsers.length > 0) {
        message += `<b>VIP Users:</b>\n`;
        vipUsers.slice(0, 10).forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString('id-ID');
          message += `${i + 1}. ${u.first_name} (@${u.username || 'no username'})\n`;
          message += `   Expired: ${exp}\n`;
        });
        if (vipUsers.length > 10) {
          message += `\n... dan ${vipUsers.length - 10} user VIP lainnya`;
        }
      }

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // All users detailed list
    if (data === "owner_all_users") {
      bot.answerCallbackQuery(query.id);
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      const normalUsers = users.filter(u => u.role === "user" || (u.role === "vip" && u.vip_expired <= Date.now()));

      if (users.length === 0) {
        return bot.sendMessage(chatId, `❌ Belum ada user di database`, { parse_mode: "HTML" });
      }

      let message = `📋 <b>Daftar Semua User</b>\n\n`;
      message += `📊 Total: ${users.length} user\n`;
      message += `💎 VIP Aktif: ${vipUsers.length}\n`;
      message += `👤 Normal: ${normalUsers.length}\n\n`;

      // VIP users
      if (vipUsers.length > 0) {
        message += `<b>VIP Users (${vipUsers.length}):</b>\n`;
        vipUsers.forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString('id-ID');
          message += `${i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id} | ⏳ ${exp}\n`;
        });
        message += `\n`;
      }

      // Normal users
      if (normalUsers.length > 0) {
        message += `<b>Normal Users (${normalUsers.length}):</b>\n`;
        normalUsers.slice(0, 20).forEach((u, i) => {
          message += `${vipUsers.length + i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id}\n`;
        });
        if (normalUsers.length > 20) {
          message += `\n... dan ${normalUsers.length - 20} user lainnya`;
        }
      }

      bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // Broadcast
    if (data === "owner_broadcast") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "broadcast_message" };
      bot.sendMessage(
        chatId,
        `📢 <b>Kirim Broadcast Message</b>\n\n` +
        `Ketik pesan yang ingin dikirim ke semua user\n\n` +
        `Ketik <code>batal</code> untuk membatalkan.`,
        { parse_mode: "HTML" }
      );
    }

    // Create code
    if (data === "owner_create_code") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "create_code_duration" };
      bot.sendMessage(
        chatId,
        `➕ <b>Buat Kode Redeem Random</b>\n\n` +
        `▸ Masukkan durasi VIP dalam hari\n` +
        `(contoh: 30)\n\n` +
        `▸ Ketik 'batal' untuk membatalkan`,
        { parse_mode: "HTML" }
      );
    }

    // Delete code
    if (data === "owner_delete_code") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `🗑️ <b>Cara Hapus Kode</b>\n\n` +
        `Gunakan format:\n` +
        `/deletecode <KODE>\n\n` +
        `Contoh:\n` +
        `/deletecode VIP123`,
        { parse_mode: "HTML" }
      );
    }

    // Set VIP manual
    if (data === "owner_set_vip") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `🎁 <b>Cara Set VIP Manual</b>\n\n` +
        `Gunakan format:\n` +
        `/setvip <USER_ID> <DURASI_HARI>\n\n` +
        `Contoh:\n` +
        `/setvip 123456789 30\n\n` +
        `Akan memberikan VIP selama 30 hari.`,
        { parse_mode: "HTML" }
      );
    }
  });

  // Handle create code input
  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];

    if (session && session.step === "create_code_duration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Buat kode dibatalkan</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        return bot.sendMessage(chatId, `⚠️ Durasi harus angka ya Kak (contoh: 30)`, { parse_mode: "HTML" });
      }

      sessions[userId].step = "create_code_expiry";
      sessions[userId].duration = duration;
      return bot.sendMessage(chatId, `➕ <b>Buat Kode Redeem</b>\n\n▸ Masukkan tanggal expired\n(format: YYYY-MM-DD)\n\nContoh: 2025-12-31\n\n▸ Ketik 'batal' untuk membatalkan`, { parse_mode: "HTML" });
    }

    if (session && session.step === "create_code_expiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ <b>Buat kode dibatalkan</b>`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      const expiry = text.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        return bot.sendMessage(chatId, `⚠️ Format tanggal salah!\n\nGunakan format: YYYY-MM-DD\nContoh: 2025-12-31`, { parse_mode: "HTML" });
      }

      // Generate random code
      const randomCode = generateRandomCode();
      const duration = sessions[userId].duration;
      const expiryDate = new Date(expiry);

      if (bot.redeemDB[randomCode]) {
        return bot.sendMessage(chatId, `⚠️ Kode sudah ada, coba lagi!`, { parse_mode: "HTML" });
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

      bot.sendMessage(chatId, `✅ <b>Kode Redeem Berhasil Dibuat</b>\n\n◆ ᴋᴏᴅᴇ ʀᴀɴᴅᴏᴍ\n\n▸ Kode: <code>${randomCode}</code>\n▸ Durasi: ${duration} hari\n▸ Expired: ${expiryDate.toLocaleDateString('id-ID')}\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      delete sessions[userId];
    }

    if (!session || session.step !== "broadcast_message") return;

    if (/^batal$/i.test(text)) {
      delete sessions[userId];
      return bot.sendMessage(chatId, `❌ Broadcast dibatalkan`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    try {
      const users = Object.values(db.users);
      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await bot.sendMessage(user.id, `📢 <b>Broadcast dari Owner</b>\n\n${text}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
          success++;
        } catch (err) {
          failed++;
        }
      }

      bot.sendMessage(chatId, `✅ <b>Broadcast Selesai</b>\n\n▸ Berhasil: ${success}\n▸ Gagal: ${failed}\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      delete sessions[userId];
    } catch (err) {
      bot.sendMessage(chatId, `❌ Error: Broadcast gagal`, { parse_mode: "HTML" });
      delete sessions[userId];
    }
  });

  // Command: Create redeem code
  bot.onText(/^\/createcode (.+) (\d+) (.+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, "❌ Khusus owner!", { parse_mode: "HTML" });
    }

    const code = match[1].toUpperCase();
    const duration = parseInt(match[2]);
    const expiresAt = match[3];

    if (bot.redeemDB[code]) {
      return bot.sendMessage(chatId, `⚠️ Kode \`${code}\` sudah ada!`, { parse_mode: "HTML" });
    }

    bot.redeemDB[code] = {
      code: code,
      type: "vip",
      duration: duration,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    bot.saveRedeemDB();

    bot.sendMessage(chatId, `✅ <b>Kode Redeem Berhasil Dibuat</b>\n\n◆ ᴋᴏᴅᴇ ᴍᴀɴᴜᴀʟ\n\n▸ Kode: <code>${code}</code>\n▸ Durasi: ${duration} hari\n▸ Expired: ${expiresAt}\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  // Command: Delete redeem code
  bot.onText(/^\/deletecode (.+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, "❌ Khusus owner!", { parse_mode: "HTML" });
    }

    const code = match[1].toUpperCase();

    if (!bot.redeemDB[code]) {
      return bot.sendMessage(chatId, `⚠️ Kode <code>${code}</code> tidak ditemukan!`, { parse_mode: "HTML" });
    }

    delete bot.redeemDB[code];
    bot.saveRedeemDB();

    bot.sendMessage(chatId, `✅ <b>Kode Redeem Berhasil Dihapus</b>\n\n▸ Kode: <code>${code}</code> sudah tidak berlaku lagi.`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  // Command: Set VIP Manual
  bot.onText(/^\/setvip (\d+) (\d+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, "❌ Khusus owner!", { parse_mode: "HTML" });
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
    bot.sendMessage(chatId, `✅ <b>VIP Manual Berhasil Diberikan</b>\n\n▸ User ID: <code>${targetUserId}</code>\n▸ Durasi: ${durationDays} hari\n▸ Expired: ${expireDate}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });
}
