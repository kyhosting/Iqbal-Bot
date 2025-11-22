export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^🎁 Redeem Code$/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `◆◆ REDEEM CODE SYSTEM ◆◆\n\n` +
      `┌─❖\n` +
      `├ 🎁 <b>Input Kode Redeem</b>\n` +
      `├ ➤ Masukkan kode redeem kamu\n` +
      `├ ➤ Ketik <code>batal</code> untuk membatalkan\n` +
      `└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboardUser(userId)
      }
    );
  });

  bot.onText(/^\/redeem$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `◆◆ REDEEM CODE SYSTEM ◆◆\n\n` +
      `┌─❖\n` +
      `├ 🎁 <b>Input Kode Redeem</b>\n` +
      `├ ➤ Masukkan kode redeem kamu\n` +
      `├ ➤ Ketik <code>batal</code> untuk membatalkan\n` +
      `└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
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

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId, 
          `❌ <b>Proses dibatalkan</b>\n\n┌─❖\n├ ➤ Redeem gagal\n└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const code = text.toUpperCase();
      const redeemData = bot.redeemDB[code];

      if (!redeemData) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `❌ <b>Kode Tidak Valid</b>\n\n◆◆ ERROR ◆◆\n\n┌─❖\n├ ➤ Kode: <code>${code}</code>\n├ ➤ Status: Tidak ditemukan\n├ ➤ Coba cek lagi ya 🙏\n└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      if (redeemData.used_by) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `❌ <b>Kode Sudah Digunakan</b>\n\n◆◆ ERROR ◆◆\n\n┌─❖\n├ ➤ Kode sudah dipakai user lain\n├ ➤ Silakan minta kode baru\n└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          }
        );
      }

      if (redeemData.expires_at) {
        const expDate = new Date(redeemData.expires_at);
        if (Date.now() > expDate.getTime()) {
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            `❌ <b>Kode Kadaluarsa</b>\n\n◆◆ EXPIRED ◆◆\n\n┌─❖\n├ ➤ Expired: ${expDate.toLocaleDateString('id-ID')}\n├ ➤ Kode sudah tidak berlaku\n└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboardUser(userId)
            }
          );
        }
      }

      let duration = redeemData.duration || 30;
      let vipExpired = Date.now() + (duration * 24 * 60 * 60 * 1000);
      let expiredDate = new Date(vipExpired);

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

      bot.redeemDB[code].used_by = userId;
      bot.redeemDB[code].used_at = new Date().toISOString();

      saveDB();
      bot.saveRedeemDB();

      await bot.sendMessage(
        chatId,
        `✅ <b>Redeem Berhasil!</b>\n\n◆◆ VIP ACTIVATED ◆◆\n\n┌─❖\n├ 💎 <b>Status</b>\n├ ➤ Kode: <code>${code}</code>\n├ ➤ Status: <b>VIP AKTIF</b>\n├ ➤ Berlaku: ${expiredDate.toLocaleDateString('id-ID')}\n├ ➤ Durasi: <b>${duration} hari</b>\n└─❖\n\n✨ Nikmati semua fitur premium ya 😊`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        }
      );

      delete sessions[userId];
    }
  });
}
