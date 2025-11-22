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
        "❌ *Menu ini hanya untuk owner ya Kak* 😊",
        { 
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
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
      `🛡️ *Panel Admin Aktif*\n\n` +
      `Silakan pilih menu yang ingin digunakan ya Kak:`,
      { 
        parse_mode: "Markdown",
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
        "❌ *Khusus owner* 😊",
        { 
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
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
      `🛡️ *Panel Admin Aktif*\n\n` +
      `Silakan pilih menu yang ingin digunakan ya Kak:`,
      { 
        parse_mode: "Markdown",
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
          "📋 *Daftar Kode Redeem*\n\nBelum ada kode redeem yang dibuat.",
          { parse_mode: "Markdown" }
        );
      }

      let message = `📋 *Daftar Kode Redeem* (${codes.length} kode)\n\n`;
      codes.forEach((code, i) => {
        const r = bot.redeemDB[code];
        const status = r.used_by ? "✅ Terpakai" : "⏳ Aktif";
        const exp = r.expires_at ? new Date(r.expires_at).toLocaleDateString('id-ID') : "Permanent";
        message += `${i + 1}. \`${code}\`\n`;
        message += `   Status: ${status}\n`;
        message += `   Durasi: ${r.duration} hari\n`;
        message += `   Expired: ${exp}\n\n`;
      });

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // List users
    if (data === "owner_list_users") {
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      
      let message = `👥 *Statistik User*\n\n`;
      message += `📊 Total User: ${users.length}\n`;
      message += `💎 VIP Aktif: ${vipUsers.length}\n`;
      message += `👤 User Biasa: ${users.length - vipUsers.length}\n\n`;
      
      if (vipUsers.length > 0) {
        message += `*VIP Users:*\n`;
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
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // All users detailed list
    if (data === "owner_all_users") {
      bot.answerCallbackQuery(query.id);
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      const normalUsers = users.filter(u => u.role === "user" || (u.role === "vip" && u.vip_expired <= Date.now()));

      if (users.length === 0) {
        return bot.sendMessage(chatId, `❌ Belum ada user di database`, { parse_mode: "Markdown" });
      }

      let message = `📋 *Daftar Semua User*\n\n`;
      message += `📊 Total: ${users.length} user\n`;
      message += `💎 VIP Aktif: ${vipUsers.length}\n`;
      message += `👤 Normal: ${normalUsers.length}\n\n`;

      // VIP users
      if (vipUsers.length > 0) {
        message += `*VIP Users (${vipUsers.length}):*\n`;
        vipUsers.forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString('id-ID');
          message += `${i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id} | ⏳ ${exp}\n`;
        });
        message += `\n`;
      }

      // Normal users
      if (normalUsers.length > 0) {
        message += `*Normal Users (${normalUsers.length}):*\n`;
        normalUsers.slice(0, 20).forEach((u, i) => {
          message += `${vipUsers.length + i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id}\n`;
        });
        if (normalUsers.length > 20) {
          message += `\n... dan ${normalUsers.length - 20} user lainnya`;
        }
      }

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // Broadcast
    if (data === "owner_broadcast") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "broadcast_message" };
      bot.sendMessage(
        chatId,
        `📢 *Kirim Broadcast Message*\n\n` +
        `Ketik pesan yang ingin dikirim ke semua user\n\n` +
        `Ketik \`batal\` untuk membatalkan.`,
        { parse_mode: "Markdown" }
      );
    }

    // Create code
    if (data === "owner_create_code") {
      bot.answerCallbackQuery(query.id);
      sessions[userId] = { step: "create_code_duration" };
      bot.sendMessage(
        chatId,
        `➕ *Buat Kode Redeem Random*\n\n` +
        `▸ Masukkan durasi VIP dalam hari\n` +
        `(contoh: 30)\n\n` +
        `▸ Ketik 'batal' untuk membatalkan`,
        { parse_mode: "Markdown" }
      );
    }

    // Delete code
    if (data === "owner_delete_code") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `🗑️ *Cara Hapus Kode*\n\n` +
        `Gunakan format:\n` +
        `/deletecode <KODE>\n\n` +
        `Contoh:\n` +
        `/deletecode VIP123`,
        { parse_mode: "Markdown" }
      );
    }

    // Set VIP manual
    if (data === "owner_set_vip") {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        `🎁 *Cara Set VIP Manual*\n\n` +
        `Gunakan format:\n` +
        `/setvip <USER_ID> <DURASI_HARI>\n\n` +
        `Contoh:\n` +
        `/setvip 123456789 30\n\n` +
        `Akan memberikan VIP selama 30 hari.`,
        { parse_mode: "Markdown" }
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
        return bot.sendMessage(chatId, `❌ *Buat kode dibatalkan*`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        return bot.sendMessage(chatId, `⚠️ Durasi harus angka ya Kak (contoh: 30)`, { parse_mode: "Markdown" });
      }

      sessions[userId].step = "create_code_expiry";
      sessions[userId].duration = duration;
      return bot.sendMessage(chatId, `➕ *Buat Kode Redeem*\n\n▸ Masukkan tanggal expired\n(format: YYYY-MM-DD)\n\nContoh: 2025-12-31\n\n▸ Ketik 'batal' untuk membatalkan`, { parse_mode: "Markdown" });
    }

    if (session && session.step === "create_code_expiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, `❌ *Buat kode dibatalkan*`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const expiry = text.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        return bot.sendMessage(chatId, `⚠️ Format tanggal salah!\n\nGunakan format: YYYY-MM-DD\nContoh: 2025-12-31`, { parse_mode: "Markdown" });
      }

      // Generate random code
      const randomCode = generateRandomCode();
      const duration = sessions[userId].duration;
      const expiryDate = new Date(expiry);

      if (bot.redeemDB[randomCode]) {
        return bot.sendMessage(chatId, `⚠️ Kode sudah ada, coba lagi!`, { parse_mode: "Markdown" });
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

      bot.sendMessage(chatId, `✅ *Kode Redeem Berhasil Dibuat*\n\n◆ ᴋᴏᴅᴇ ʀᴀɴᴅᴏᴍ\n\n▸ Kode: \`${randomCode}\`\n▸ Durasi: ${duration} hari\n▸ Expired: ${expiryDate.toLocaleDateString('id-ID')}\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      delete sessions[userId];
    }

    if (!session || session.step !== "broadcast_message") return;

    if (/^batal$/i.test(text)) {
      delete sessions[userId];
      return bot.sendMessage(chatId, `❌ Broadcast dibatalkan`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    try {
      const users = Object.values(db.users);
      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await bot.sendMessage(user.id, `📢 *Broadcast dari Owner*\n\n${text}`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
          success++;
        } catch (err) {
          failed++;
        }
      }

      bot.sendMessage(chatId, `✅ *Broadcast Selesai*\n\n▸ Berhasil: ${success}\n▸ Gagal: ${failed}\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      delete sessions[userId];
    } catch (err) {
      bot.sendMessage(chatId, `❌ Error: Broadcast gagal`, { parse_mode: "Markdown" });
      delete sessions[userId];
    }
  });

  // Command: Create redeem code
  bot.onText(/^\/createcode (.+) (\d+) (.+)$/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(chatId, "❌ Khusus owner!", { parse_mode: "Markdown" });
    }

    const code = match[1].toUpperCase();
    const duration = parseInt(match[2]);
    const expiresAt = match[3];

    if (bot.redeemDB[code]) {
      return bot.sendMessage(chatId, `⚠️ Kode \`${code}\` sudah ada!`, { parse_mode: "Markdown" });
    }

    bot.redeemDB[code] = {
      code: code,
      type: "vip",
      duration: duration,
      expires_at: new Date(expiresAt).toISOString(),
      created_at: new Date().toISOString(),
      used_by: null
    };

    bot.saveRedeemDB();
    bot.sendMessage(chatId, `✅ Kode \`${code}\` berhasil dibuat untuk ${duration} hari!`, { parse_mode: "Markdown" });
  });
}
