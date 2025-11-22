export default function (bot, db, saveDB) {
  bot.onText(/^/me$/, async/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

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

    const profileMessage = `👤 *PROFIL USER*\n\n╭─❖\n│ 🎌 *Informasi Dasar*\n│ Nama: *${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}*\n│ ID: \`${userId}\`\n│ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n╰───────────────❖\n\n╭─❖\n│ 🎯 *Status Akses*\n│ Role: *${role.toUpperCase()}*\n│ VIP Status: ${vipBadge}\n│ Masa Berlaku: *${expired}*\n│ Waktu Tersisa: *${remaining}*\n╰───────────────❖\n\n╭─❖\n│ 📊 *Statistik*\n│ Total Operasi: *${user.total_operation || 0}*\n│ Member Sejak: *${new Date().toLocaleDateString('id-ID')}*\n╰───────────────❖\n\n💡 Untuk upgrade VIP, gunakan kode redeem dengan command:\n\`/redeem KODE\` atau klik tombol "🎁 Redeem Code"`;

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: "Markdown",
      reply_markup: bot.getMainKeyboard()
    });
  });
}