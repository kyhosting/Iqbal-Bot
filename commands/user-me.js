export default function (bot, db, saveDB) {
  bot.onText(/^\/me$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ <b>Akses Ditolak</b>\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "HTML" }
      );
    }

    // Ensure user exists in database
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

    const role = bot.getRole(userId);
    const user = db.users[userId];
    
    // Hitung sisa hari VIP
    let expired = "Tidak Aktif";
    let remaining = "0 hari";
    let status = user.status || "inactive";
    let vipBadge = "❌ Tidak Aktif";
    
    if (user.vip_expired && user.vip_expired > Date.now()) {
      const expDate = new Date(user.vip_expired);
      expired = expDate.toLocaleDateString('id-ID');
      const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
      remaining = `${daysLeft} hari`;
      status = "active";
      vipBadge = `✅ Aktif - ${daysLeft} hari lagi`;
    }

    const profileMessage = `👤 <b>PROFIL USER</b>\n\n` +
      `╭─❖\n` +
      `│ 🎌 <b>Informasi Dasar</b>\n` +
      `│ Nama: <b>${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}</b>\n` +
      `│ ID: \`${userId}\`\n` +
      `│ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n` +
      `╰───────────────❖\n\n` +
      `╭─❖\n` +
      `│ 🎯 <b>Status Akses</b>\n` +
      `│ Role: <b>${role.toUpperCase()}</b>\n` +
      `│ VIP Status: ${vipBadge}\n` +
      `│ Masa Berlaku: <b>${expired}</b>\n` +
      `│ Waktu Tersisa: <b>${remaining}</b>\n` +
      `╰───────────────❖\n\n` +
      `╭─❖\n` +
      `│ 📊 <b>Statistik</b>\n` +
      `│ Total Operasi: <b>${user.total_operation || 0}</b>\n` +
      `│ Member Sejak: <b>${new Date().toLocaleDateString('id-ID')}</b>\n` +
      `╰───────────────❖\n\n` +
      `💡 Untuk upgrade VIP, gunakan kode redeem dengan command:\n` +
      `\`/redeem KODE\` atau klik tombol "🎁 Redeem Code"`;

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  });
}
