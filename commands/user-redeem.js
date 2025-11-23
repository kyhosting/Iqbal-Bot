export default function (bot, db, saveDB) {
  const sessions = {};
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ$|^🎁 REDEEM CODE$|^\/redeem$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk VIP users kak!
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    sessions[userId] = { step: 1 };
    trackMessage(
      userId,
      chatId,
      `◆◆  REDEEM CODE SYSTEM  ◆◆

┌─❖
│  🎁 Input Kode Redeem
│
│  Masukkan kode redeem kamu
│
│  Ketik 'batal' untuk membatalkan
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Redeem dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const code = text.toUpperCase();
      const redeemData = bot.redeemDB[code];

      if (!redeemData) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  KODE TIDAK VALID  ◆◆

┌─❖
│  Kode: ${code}
│
│  Status: Tidak ditemukan
│
│  Coba cek lagi ya 🙏
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (redeemData.used_by) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  KODE SUDAH DIGUNAKAN  ◆◆

┌─❖
│  Kode sudah dipakai user lain
│
│  Silakan minta kode baru
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      // Check if code has expired (based on duration from creation time)
      if (redeemData.expires_in_ms && redeemData.created_at) {
        const expiryTime = redeemData.created_at + redeemData.expires_in_ms;
        if (Date.now() > expiryTime) {
          delete sessions[userId];
          return sendWithDelete(
            userId,
            chatId,
            `◆◆  KODE KADALUARSA  ◆◆

┌─❖
│  Code sudah expired
│
│  Kode sudah tidak berlaku
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }
      }

      let duration = redeemData.duration || 30;
      let vipExpired = Date.now() + (duration * 24 * 60 * 60 * 1000);

      const user = db.users[userId] || {};
      if (user.vip_expired && user.vip_expired > Date.now()) {
        vipExpired = user.vip_expired + (duration * 24 * 60 * 60 * 1000);
      }

      redeemData.used_by = userId;
      redeemData.used_date = new Date().toLocaleDateString('id-ID');
      bot.saveRedeemDB();

      if (!db.users[userId]) {
        db.users[userId] = {
          id: userId,
          username: "",
          first_name: "",
          last_name: "",
          role: "vip",
          vip_expired: vipExpired,
          status: "active",
          total_operation: 0
        };
      } else {
        db.users[userId].role = "vip";
        db.users[userId].vip_expired = vipExpired;
        db.users[userId].status = "active";
      }
      saveDB();

      const daysLeft = Math.ceil((vipExpired - Date.now()) / (1000 * 60 * 60 * 24));

      delete sessions[userId];
      return sendWithDelete(
        userId,
        chatId,
        `◆◆  REDEEM SUKSES  ◆◆

┌─❖
│  ✅ VIP Activated!
│
│  Kode: <code>${code}</code>
│
│  Durasi: ${duration} hari
│
│  Sisa: ${daysLeft} hari
│
│  💎 Selamat bersenang-senang!
└─❖`,
        { parse_mode: "HTML", reply_markup: {
          inline_keyboard: [
            [{ text: "📋 Salin Kode", callback_data: `copy_code_${code}` }],
            ...bot.getMainKeyboardUser(userId).keyboard
          ]
        }}
      );
    }
  });
}
