export default function (bot, db, saveDB) {
  bot.onText(/^\/me$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ <b>Akses Ditolak</b>\n\n┌─❖\n├ ➤ Harus join grup terlebih dahulu\n└─❖`,
        { parse_mode: "HTML" }
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
      vipBadge = `✅ Aktif - ${daysLeft} hari`;
    }

    const profileMessage = `◆◆ PROFIL USER ◆◆\n\n` +
      `┌─❖\n` +
      `├ 🎌 <b>INFORMASI DASAR</b>\n` +
      `├ ➤ Nama: <b>${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}</b>\n` +
      `├ ➤ ID: <code>${userId}</code>\n` +
      `├ ➤ Username: @${msg.from.username || '-'}\n` +
      `└─❖\n\n` +
      `┌─❖\n` +
      `├ 🎯 <b>STATUS AKSES</b>\n` +
      `├ ➤ Role: <b>${role.toUpperCase()}</b>\n` +
      `├ ➤ VIP: ${vipBadge}\n` +
      `├ ➤ Masa Aktif: <b>${expired}</b>\n` +
      `├ ➤ Sisa Hari: <b>${remaining}</b>\n` +
      `└─❖\n\n` +
      `┌─❖\n` +
      `├ 📊 <b>STATISTIK</b>\n` +
      `├ ➤ Total Operasi: <b>${user.total_operation || 0}</b>\n` +
      `├ ➤ Member Sejak: ${new Date().toLocaleDateString('id-ID')}\n` +
      `└─❖\n\n` +
      `💡 Upgrade VIP:\n` +
      `<code>/redeem KODE</code> atau klik 🎁 Redeem Code`;

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  });
}
