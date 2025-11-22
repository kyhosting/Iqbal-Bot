import config from "../config.js";

export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // ===== OWNER BYPASS - Go straight to dashboard =====
    if (config.owner.includes(userId)) {
      return showDashboard(bot, userId, chatId, db, saveDB);
    }

    const user = db.users[userId];

    // ===== USER YANG SUDAH AKTIF - No verification needed =====
    if (user && !user.suspended && user.status === "active") {
      return showDashboard(bot, userId, chatId, db, saveDB);
    }

    // ===== USER YANG SUSPENDED - Must rejoin =====
    if (user && user.suspended) {
      const verifyKeyboard = {
        inline_keyboard: [
          [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
        ]
      };

      return bot.sendMessage(
        chatId,
        `⚠️ Wajib join 2 grup untuk akses`,
        { reply_markup: verifyKeyboard }
      );
    }

    // ===== NEW USER - Show verification =====
    const verifyKeyboard = {
      inline_keyboard: [
        [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
      ]
    };

    return bot.sendMessage(
      chatId,
      `⚠️ Wajib join 2 grup untuk akses`,
      { reply_markup: verifyKeyboard }
    );
  });

  // ===== CALLBACK: Verify Join Button =====
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (query.data === "verify_join") {
      await bot.answerCallbackQuery(query.id);

      // Check group membership
      const groupCheck = await bot.checkGroupMembership(userId);

      if (!groupCheck.verified) {
        // User belum join - kirim pesan dengan deep-link button SAJA
        const groupMainDeeplink = `https://t.me/agentviber12?join`;
        const groupCvDeeplink = `https://t.me/channelviber?join`;

        const joinKeyboard = {
          inline_keyboard: [
            [
              { text: "📱 @agentviber12", url: groupMainDeeplink }
            ],
            [
              { text: "📱 @channelviber", url: groupCvDeeplink }
            ],
            [{ text: "✅ Sudah Join", callback_data: "verify_again" }]
          ]
        };

        // Delete old message & send new one (minimal text, button only)
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.sendMessage(
            chatId,
            `⚠️ Wajib join 2 grup terlebih dahulu`,
            { reply_markup: joinKeyboard }
          );
        } catch (err) {
          console.error("Error di verify_join:", err);
        }
      } else {
        // User sudah join - delete message & proceed to dashboard
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await showDashboard(bot, userId, chatId, db, saveDB);
        } catch (err) {
          console.error("Error di verify_join (already joined):", err);
        }
      }
    }

    // ===== CALLBACK: Verify Join Button (dari /start) =====
    // Note: verify_again callback sudah di handle global di index.js
  });
}

// ===== HELPER: Show Dashboard =====
async function showDashboard(bot, userId, chatId, db, saveDB) {
  let user = db.users[userId];

  // Jika user belum ada, tambahkan ke database + kasih trial 1 hari
  if (!user) {
    const trialExpired = Date.now() + 1 * 24 * 60 * 60 * 1000; // 1 hari
    db.users[userId] = {
      id: userId,
      username: (await bot.getChat(userId)).username || "",
      first_name: (await bot.getChat(userId)).first_name || "",
      last_name: (await bot.getChat(userId)).last_name || "",
      role: config.owner.includes(userId) ? "owner" : "trial",
      vip_expired: config.owner.includes(userId) ? 0 : trialExpired,
      status: "active",
      total_operation: 0,
      notified_expiry: false,
      trial_start: Date.now(),
      suspended: false
    };
    saveDB();

    // Notif trial diberikan (hanya untuk non-owner)
    if (!config.owner.includes(userId)) {
      await bot.sendMessage(
        userId,
        `🎁 *TRIAL 1 HARI GRATIS!*\n\n` +
          `Selamat! Kamu sudah verifikasi grup 🎉\n\n` +
          `✅ Akses trial selama 1 hari sudah aktif!\n` +
          `⏰ Berlaku sampai: ${new Date(trialExpired).toLocaleDateString("id-ID")}\n\n` +
          `Nikmati semua fitur premium dulu ya Kak! 💎\n` +
          `Setelah trial habis, beli VIP untuk terus akses 😊`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      ).catch(() => {});
    }
  } else {
    // User sudah ada - restore jika suspended
    if (user.suspended && user.vip_expired && user.vip_expired > Date.now()) {
      user.suspended = false;
      user.status = "active";
      if (!user.role || user.role === "user") {
        user.role = user.trial_start ? "trial" : "vip";
      }
      saveDB();

      const daysLeft = Math.ceil(
        (user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24)
      );
      await bot.sendMessage(
        userId,
        `✅ *Akses Dipulihkan Kak!*\n\n` +
          `Kamu sudah join kedua grup 🎉\n\n` +
          `✨ Trial/VIP kamu aktif kembali!\n` +
          `⏰ Sisa: *${daysLeft} hari*\n\n` +
          `Lanjut nikmati fitur premium ya 😊`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      ).catch(() => {});
    }
  }

  // Get user data (refresh)
  user = db.users[userId];
  const role = bot.getRole(userId);

  // Hitung sisa hari VIP
  let expired = "Tidak Aktif";
  let remaining = "0 hari";
  let status = user.status || "inactive";

  if (user.vip_expired && user.vip_expired > Date.now()) {
    const expDate = new Date(user.vip_expired);
    expired = expDate.toLocaleDateString("id-ID");
    const daysLeft = Math.ceil(
      (user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24)
    );
    remaining = `${daysLeft} hari`;
    status = "active";
  }

  // Ambil foto profil user
  const caption =
    `🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n(by iqbaldev)\n\n` +
    `╭─❖\n` +
    `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
    `│ 私はファイル変換と管理を担当します。\n` +
    `│ ✦ Created by: @Iqbaldev\n` +
    `╰───────────────❖\n\n` +
    `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
    `│ ➤ Nama: *${user.first_name || "User"}*\n` +
    `│ ➤ ID: \`${userId}\`\n` +
    `│ ➤ Username: @${user.username || "-"}\n` +
    `│ ➤ Role: *${role.toUpperCase()}*\n` +
    `│ ➤ Status: *${status === "active" ? "✅ Aktif" : "❌ Tidak Aktif"}*\n` +
    `│ ➤ Masa Aktif: *${expired}*\n` +
    `│ ➤ Hari Tersisa: *${remaining}*\n` +
    `│ ➤ Total Operasi: *${user.total_operation || 0}*\n` +
    `╰───────────────❖\n\n` +
    `╭─❖ ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ\n` +
    `│ ➤ 📄 TXT 📇 VCF 📊 XLSX\n` +
    `│ ➤ 他の形式も順次対応予定です。\n` +
    `╰───────────────❖\n\n` +
    `╭─❖ ᴍᴇɴᴜ ʙᴏᴛ\n` +
    `│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ\n` +
    `│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ\n` +
    `│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n` +
    `│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ\n` +
    `│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n` +
    `│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ\n` +
    `│ ➤ ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ\n` +
    `│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ\n` +
    `│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ\n` +
    `│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ\n` +
    `│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ\n` +
    `│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ\n` +
    `│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ\n` +
    `╰───────────────❖\n\n` +
    `💎 ご利用ありがとうございます。\n` +
    `このボットは常に進化しています ⚙️`;

  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      await bot.sendPhoto(chatId, fileId, {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      });
    }
  } catch (err) {
    console.error("Error getting profile photo:", err);
    await bot.sendMessage(chatId, caption, {
      parse_mode: "Markdown",
      reply_markup: bot.getMainKeyboard()
    });
  }
}
