export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    
    if (!groupCheck.verified) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: "📱 Join @agentviber12", url: "https://t.me/agentviber12" }
          ],
          [
            { text: "📱 Join @channelviber", url: "https://t.me/channelviber" }
          ],
          [
            { text: "✅ Saya sudah join — Verifikasi", callback_data: "start_recheck" }
          ]
        ]
      };
      
      return bot.sendMessage(
        chatId,
        `🔐 *VERIFIKASI GRUP DIPERLUKAN*\n\n` +
        `Silakan bergabung ke grup berikut untuk mendapatkan akses gratis 24 jam:\n\n` +
        `📌 *@agentviber12* - Grup utama\n` +
        `📌 *@channelviber* - Channel CV\n\n` +
        `Setelah bergabung, klik tombol di bawah untuk verifikasi akses Anda 😊`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      );
    }

    // Jika user belum ada, tambahkan ke database + kasih trial 1 hari
    if (!db.users[userId]) {
      const trialExpired = Date.now() + (1 * 24 * 60 * 60 * 1000); // 1 hari
      db.users[userId] = {
        id: userId,
        username: msg.from.username || "",
        first_name: msg.from.first_name || "",
        last_name: msg.from.last_name || "",
        role: "trial",
        vip_expired: trialExpired,
        status: "active",
        total_operation: 0,
        notified_expiry: false,
        trial_start: Date.now()
      };
      saveDB();
      
      // Notif trial diberikan
      await bot.sendMessage(userId, 
        `🎁 *TRIAL 1 HARI GRATIS!*\n\n` +
        `Selamat! Kamu sudah verifikasi grup 🎉\n\n` +
        `✅ Akses trial selama 1 hari sudah aktif!\n` +
        `⏰ Berlaku sampai: ${new Date(trialExpired).toLocaleDateString('id-ID')}\n\n` +
        `Nikmati semua fitur premium dulu ya Kak! 💎\n` +
        `Setelah trial habis, beli VIP untuk terus akses 😊`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      ).catch(() => {});
    }

    // Ambil role user
    const role = bot.getRole(userId);
    const user = db.users[userId];
    
    // Hitung sisa hari VIP
    let expired = "Tidak Aktif";
    let remaining = "0 hari";
    let status = user.status || "inactive";
    
    if (user.vip_expired && user.vip_expired > Date.now()) {
      const expDate = new Date(user.vip_expired);
      expired = expDate.toLocaleDateString('id-ID');
      const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
      remaining = `${daysLeft} hari`;
      status = "active";
    }

    // Ambil foto profil user
    try {
      const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
      
      const caption = `🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n(by iqbaldev)\n\n` +
        `╭─❖\n` +
        `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
        `│ 私はファイル変換と管理を担当します。\n` +
        `│ ✦ Created by: @Iqbaldev\n` +
        `╰───────────────❖\n\n` +
        `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
        `│ ➤ Nama: *${msg.from.first_name}*\n` +
        `│ ➤ ID: \`${userId}\`\n` +
        `│ ➤ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n` +
        `│ ➤ Role: *${role.toUpperCase()}*\n` +
        `│ ➤ Status: *${status === 'active' ? '✅ Aktif' : '❌ Tidak Aktif'}*\n` +
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

      if (photos.total_count > 0) {
        // Kirim dengan foto profil
        const fileId = photos.photos[0][0].file_id;
        await bot.sendPhoto(chatId, fileId, {
          caption: caption,
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        });
      } else {
        // Kirim tanpa foto
        await bot.sendMessage(chatId, caption, {
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        });
      }
    } catch (err) {
      console.error("Error getting profile photo:", err);
      // Fallback - kirim tanpa foto
      const caption = `🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n(by iqbaldev)\n\n` +
        `╭─❖\n` +
        `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
        `│ 私はファイル変換と管理を担当します。\n` +
        `│ ✦ Created by: @Iqbaldev\n` +
        `╰───────────────❖\n\n` +
        `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
        `│ ➤ Nama: *${msg.from.first_name}*\n` +
        `│ ➤ ID: \`${userId}\`\n` +
        `│ ➤ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n` +
        `│ ➤ Role: *${role.toUpperCase()}*\n` +
        `│ ➤ Status: *${status === 'active' ? '✅ Aktif' : '❌ Tidak Aktif'}*\n` +
        `│ ➤ Masa Aktif: *${expired}*\n` +
        `│ ➤ Hari Tersisa: *${remaining}*\n` +
        `│ ➤ Total Operasi: *${user.total_operation || 0}*\n` +
        `╰───────────────❖\n\n` +
        `💎 ご利用ありがとうございます。`;

      await bot.sendMessage(chatId, caption, {
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      });
    }

    // Log ke console
    console.log(`🔹 /start digunakan oleh: ${msg.from.first_name} (@${msg.from.username || "no username"}), ID: ${userId}`);
  });

  // Handle inline button callback untuk recheck
  bot.on('callback_query', async (query) => {
    if (query.data === 'start_recheck') {
      const userId = query.from.id;
      const chatId = query.message.chat.id;
      
      const groupCheck = await bot.checkGroupMembership(userId);
      
      if (groupCheck.verified) {
        await bot.answerCallbackQuery(query.id, "✅ Verifikasi berhasil! Lanjut...", true);
        // Trigger /start command
        const msg = { from: query.from, chat: { id: chatId }, text: '/start' };
        msg.from.first_name = query.from.first_name;
        msg.from.username = query.from.username;
        
        // Call start handler manually by re-triggering the /start logic
        // Actually, we'll just send the welcome message directly
        if (!db.users[userId]) {
          db.users[userId] = {
            id: userId,
            username: query.from.username || "",
            first_name: query.from.first_name || "",
            last_name: query.from.last_name || "",
            role: "user",
            vip_expired: 0,
            status: "inactive",
            total_operation: 0
          };
          saveDB();
        }
        
        const role = bot.getRole(userId);
        const user = db.users[userId];
        
        let expired = "Tidak Aktif";
        let remaining = "0 hari";
        let status = user.status || "inactive";
        
        if (user.vip_expired && user.vip_expired > Date.now()) {
          const expDate = new Date(user.vip_expired);
          expired = expDate.toLocaleDateString('id-ID');
          const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
          remaining = `${daysLeft} hari`;
          status = "active";
        }
        
        const caption = `✅ *Verifikasi Berhasil!*\n\n🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*\n\n` +
          `Selamat datang, *${query.from.first_name}*! 🎉`;
        
        await bot.sendMessage(chatId, caption, {
          parse_mode: "Markdown",
          reply_markup: bot.getMainKeyboard()
        });
      } else {
        await bot.answerCallbackQuery(query.id, "❌ Kamu belum join semua grup!", true);
      }
    }
  });
}
