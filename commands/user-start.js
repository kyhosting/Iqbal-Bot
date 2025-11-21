export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    
    if (!groupCheck.verified) {
      const missingGroups = [];
      if (!groupCheck.inGroup1) missingGroups.push(`@agentviber12`);
      if (!groupCheck.inGroup2) missingGroups.push(`@channelviber`);
      
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak Kak!*\n\n` +
        `Kamu harus join grup ini dulu ya:\n` +
        `${missingGroups.map(g => `• ${g}`).join('\n')}\n\n` +
        `Setelah join, ketik /start lagi 😊`,
        { parse_mode: "Markdown" }
      );
    }

    // Jika user belum ada, tambahkan ke database
    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        username: msg.from.username || "",
        first_name: msg.from.first_name || "",
        last_name: msg.from.last_name || "",
        role: "user",
        vip_expired: 0,
        status: "inactive",
        total_operation: 0
      };
      saveDB();
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
}
