export default function (bot, db, saveDB) {
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.messageid;
    return msg;
  }

  bot.onText(/^\/me$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return trackMessage(
        userId,
        chatId,
        ◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ⚠️ Harus join grup terlebih dahulu
└─❖,
        { parsemode: "Markdown" }
      );
    }

    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        username: msg.from.username || "",
        firstname: msg.from.firstname || "",
        lastname: msg.from.lastname || "",
        role: "user",
        vipexpired: 0,
        status: "inactive",
        totaloperation: 0
      };
      saveDB();
    }

    const role = bot.getRole(userId);
    const user = db.users[userId];
    
    let expired = "Tidak Aktif";
    let remaining = "0 hari";
    let status = user.status || "inactive";
    let vipBadge = "❌ Tidak Aktif";
    
    if (user.vipexpired && user.vipexpired > Date.now()) {
      const expDate = new Date(user.vipexpired);
      expired = expDate.toLocaleDateString('id-ID');
      const daysLeft = Math.ceil((user.vipexpired - Date.now()) / (1000  60  60 * 24));
      remaining = ${daysLeft} hari;
      status = "active";
      vipBadge = ✅ Aktif - ${daysLeft} hari;
    }

    const profileMessage = ◆◆  PROFIL USER  ◆◆

┌─❖
│  🎌 INFORMASI DASAR
│
│  Nama: ${msg.from.firstname}${msg.from.lastname ? ' ' + msg.from.lastname : ''}
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
│  Total Operasi: ${user.totaloperation || 0}
│
│  Member Sejak: ${new Date().toLocaleDateString('id-ID')}
└─❖

┌─❖
│  💡 Upgrade VIP: /redeem KODE
│
│  Ketik 'me' untuk refresh
│  Ketik 'start' untuk menu
└─❖;

    await trackMessage(userId, chatId, profileMessage, {
      parsemode: "Markdown",
      replymarkup: bot.getMainKeyboardUser(userId)
    });
  });
}
