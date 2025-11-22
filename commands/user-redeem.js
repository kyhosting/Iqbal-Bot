export default function (bot, db, saveDB) {
  const sessions = {};

  // Handle keyboard button "🎁 Redeem Code"
  bot.onText(/^🎁 Redeem Code$/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `🎁 <b>Redeem Code System</b>\n\n` +
      `Silakan masukkan kode redeem kamu ya Kak ✨\n\n` +
      `Ketik \`batal\` untuk membatalkan.`,
      { 
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboardUser(userId)
      }
    );
  });

  // Handle /redeem command
  bot.onText(/^\/redeem$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `🎁 <b>Redeem Code System</b>\n\n` +
      `Silakan masukkan kode redeem kamu ya Kak ✨\n\n` +
      `Ketik \`batal\` untuk membatalkan.`,
      { 
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboardUser(userId)
      }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    // Step 1: Input kode redeem
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          "❌ Proses dibatalkan ya Kak 😊",
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const code = text.toUpperCase();
      const redeemData = bot.redeemDB[code];

      if (!redeemData) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `❌ <b>Yah… kode redeem tidak valid</b>\n\n` +
          `Kode \`${code}\` tidak ditemukan Kak.\n` +
          `Coba cek lagi ya 🙏`,
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      // Check if already used
      if (redeemData.used_by) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `❌ <b>Yah… kode sudah digunakan</b>\n\n` +
          `Kode ini sudah dipakai sama user lain Kak 😔\n` +
          `Coba minta kode baru ya!`,
          { 
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      // Check expiry
      if (redeemData.expires_at) {
        const expDate = new Date(redeemData.expires_at);
        if (Date.now() > expDate.getTime()) {
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            `❌ <b>Yah… kode sudah kadaluarsa</b>\n\n` +
            `Kode ini sudah expired sejak ${expDate.toLocaleDateString('id-ID')} 😔`,
            { 
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboardUser(userId)
            }
          );
        }
      }

      // Redeem sukses!
      let duration = redeemData.duration || 30; // default 30 hari
      let vipExpired = Date.now() + (duration <b> 24 </b> 60 <b> 60 </b> 1000);
      let expiredDate = new Date(vipExpired);

      // Update user
      if (!db.users[userId]) {
        db.users[userId] = {
          id: userId,
          username: msg.from.username || "",
          first_name: msg.from.first_name || "",
          last_name: msg.from.last_name || "",
          role: "vip",
          vip_expired: vipExpired,
          status: "active",
          total_operation: 0,
          notified_expiry: false
        };
      } else {
        db.users[userId].role = "vip";
        db.users[userId].vip_expired = vipExpired;
        db.users[userId].status = "active";
        db.users[userId].notified_expiry = false;
      }

      // Mark redeem as used and save immediately
      bot.redeemDB[code].used_by = userId;
      bot.redeemDB[code].used_at = new Date().toISOString();

      saveDB();
      bot.saveRedeemDB();

      await bot.sendMessage(
        chatId,
        `🎉 <b>Mantap Kak!</b>\n\n` +
        `Kode redeem kamu valid dan sudah berhasil digunakan 💎\n\n` +
        `✨ <b>Status:</b> VIP Aktif\n` +
        `⏳ <b>Berlaku sampai:</b> ${expiredDate.toLocaleDateString('id-ID')}\n` +
        `📅 <b>Durasi:</b> ${duration} hari\n\n` +
        `Silakan nikmati semua fitur premium ya 😊`,
        { 
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        }
      );

      delete sessions[userId];
    }
  });
}
