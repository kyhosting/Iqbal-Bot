export default function (bot, db, saveDB) {
  bot.onText(/^\/me$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ⚠️ Harus join grup terlebih dahulu
└─❖`,
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

    const profileMessage = `◆◆  PROFIL USER  ◆◆

┌─❖
│  🎌 INFORMASI DASAR
│
│  Nama: ${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}
│
│  ID: ${userId}
│
│  Username: @${msg.from.username || '-'}
└─❖

┌─❖
│  🎯 STATUS AKSES
│
│  Role: ${role.toUpperCase()}
│
│  VIP: ${vipBadge}
│
│  Masa Aktif: ${expired}
│
│  Sisa Hari: ${remaining}
└─❖

┌─❖
│  📊 STATISTIK
│
│  Total Operasi: ${user.total_operation || 0}
│
│  Member Sejak: ${new Date().toLocaleDateString('id-ID')}
└─❖

💡 Upgrade VIP: /redeem KODE`;

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  });
}
