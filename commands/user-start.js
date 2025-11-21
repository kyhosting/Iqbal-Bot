export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // STEP 1: Show mandatory verification message
    const verifyKeyboard = {
      inline_keyboard: [
        [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
      ]
    };

    return bot.sendMessage(
      chatId,
      `⚠️ *Wajib Join Grup Untuk Mengakses Bot*\n\n` +
      `Klik tombol di bawah untuk verifikasi keanggotaan Anda.`,
      { parse_mode: "Markdown", reply_markup: verifyKeyboard }
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
        // User belum join - kirim pesan dengan deep-link + button
        const groupMainDeeplink = `https://t.me/agentviber12?join`;
        const groupCvDeeplink = `https://t.me/channelviber?join`;

        const joinKeyboard = {
          inline_keyboard: [
            [
              { text: "📱 @agentviber12", url: groupMainDeeplink },
              { text: "📱 @channelviber", url: groupCvDeeplink }
            ],
            [{ text: "✅ Sudah Join", callback_data: "verify_again" }]
          ]
        };

        // Delete old message & send new one
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.sendMessage(
            chatId,
            `⚠️ *Silakan Join Grup Terlebih Dahulu*\n\n` +
            `Klik tombol di bawah untuk join ke kedua grup:\n\n` +
            `📌 *@agentviber12* - Grup utama\n` +
            `📌 *@channelviber* - Channel CV\n\n` +
            `Setelah join, klik "Sudah Join" untuk verifikasi 😊`,
            { parse_mode: "Markdown", reply_markup: joinKeyboard }
          );
        } catch (err) {
          console.error("Error di verify_join:", err);
        }
      } else {
        // User sudah join - delete message & proceed to dashboard
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await showDashboard(bot, userId, chatId, db);
        } catch (err) {
          console.error("Error di verify_join (already joined):", err);
        }
      }
    }

    // ===== CALLBACK: Verify Again Button =====
    if (query.data === "verify_again") {
      await bot.answerCallbackQuery(query.id);

      const groupCheck = await bot.checkGroupMembership(userId);

      if (!groupCheck.verified) {
        // Still not joined
        await bot.answerCallbackQuery(query.id, {
          text: "⚠️ Anda masih belum join kedua grup. Silakan join terlebih dahulu!",
          show_alert: true
        });
      } else {
        // User sudah join - delete message & proceed
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await showDashboard(bot, userId, chatId, db);
        } catch (err) {
          console.error("Error di verify_again:", err);
        }
      }
    }
  });
}

// ===== HELPER: Show Dashboard setelah verifikasi =====
async function showDashboard(bot, userId, chatId, db) {
  const user = db.users[userId];

  // Jika user belum ada, tambahkan ke database + kasih trial 1 hari
  if (!user) {
    const trialExpired = Date.now() + (1 * 24 * 60 * 60 * 1000); // 1 hari
    db.users[userId] = {
      id: userId,
      username: (await bot.getChat(userId)).username || "",
      first_name: (await bot.getChat(userId)).first_name || "",
      last_name: (await bot.getChat(userId)).last_name || "",
      role: "trial",
      vip_expired: trialExpired,
      status: "active",
      total_operation: 0,
      notified_expiry: false,
      trial_start: Date.now(),
      suspended: false
    };
    // bikinDB();

    // Notif trial diberikan
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
  } else {
    // User sudah ada - restore jika suspended
    if (user.suspended && user.vip_expired && user.vip_expired > Date.now()) {
      user.suspended = false;
      user.status = "active";
      if (!user.role || user.role === "user") {
        user.role = user.trial_start ? "trial" : "vip";
      }
      // bikinDB();

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
  let userUpdated = db.users[userId];
  const role = bot.getRole(userId);

  // Hitung sisa hari VIP
  let expired = "Tidak Aktif";
  let remaining = "0 hari";
  let status = userUpdated.status || "inactive";

  if (userUpdated.vip_expired && userUpdated.vip_expired > Date.now()) {
    const expDate = new Date(userUpdated.vip_expired);
    expired = expDate.toLocaleDateString("id-ID");
    const daysLeft = Math.ceil(
      (userUpdated.vip_expired - Date.now()) / (1000 * 60 * 60 * 24)
    );
    remaining = `${daysLeft} hari`;
    status = "active";
  }

  // Ambil foto profil user
  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });

    const caption =
      `🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n(by iqbaldev)\n\n` +
      `╭─❖\n` +
      `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
      `│ 私はファイル変換と管理を担当します。\n` +
      `│ ✦ Created by: @Iqbaldev\n` +
      `╰───────────────❖\n\n` +
      `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
      `│ ➤ Nama: *${(await bot.getChat(userId)).first_name}*\n` +
      `│ ➤ ID: \`${userId}\`\n` +
      `│ ➤ Username: ${(await bot.getChat(userId)).username ? "@" + (await bot.getChat(userId)).username : "-"}\n` +
      `│ ➤ Role: *${role.toUpperCase()}*\n` +
      `│ ➤ Status: *${status === "active" ? "✅ Aktif" : "❌ Tidak Aktif"}*\n` +
      `│ ➤ Masa Aktif: *${expired}*\n` +
      `│ ➤ Hari Tersisa: *${remaining}*\n` +
      `│ ➤ Total Operasi: *${userUpdated.total_operation || 0}*\n` +
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
    const caption =
      `🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n(by iqbaldev)\n\n` +
      `╭─❖\n` +
      `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
      `│ 私はファイル変換と管理を担当します。\n` +
      `│ ✦ Created by: @Iqbaldev\n` +
      `╰───────────────❖\n\n` +
      `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
      `│ ➤ Role: *${role.toUpperCase()}*\n` +
      `│ ➤ Status: *${status === "active" ? "✅ Aktif" : "❌ Tidak Aktif"}*\n` +
      `│ ➤ Masa Aktif: *${expired}*\n` +
      `│ ➤ Hari Tersisa: *${remaining}*\n` +
      `│ ➤ Total Operasi: *${userUpdated.total_operation || 0}*\n` +
      `╰───────────────❖\n\n` +
      `💎 ご利用ありがとうございます。`;

    await bot.sendMessage(chatId, caption, {
      parse_mode: "Markdown",
      reply_markup: bot.getMainKeyboard()
    });
  }
}
