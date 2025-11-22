import config from "../config.js";

export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // ===== OWNER BYPASS - Go straight to dashboard =====
    if (config.owner.includes(userId)) {
      return bot.showDashboard(userId, chatId);
    }

    const user = db.users[userId];

    // ===== USER YANG SUDAH AKTIF - No verification needed =====
    if (user && !user.suspended && user.status === "active") {
      return bot.showDashboard(userId, chatId);
    }

    // ===== USER YANG SUSPENDED - Must rejoin =====
    if (user && user.suspended) {
      const verifyKeyboard = {
        inline_keyboard: [
          [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
        ]
      };

      return bot.sendMessage(
        chatId,
        `⚠️ Wajib join 2 grup untuk akses`,
        { reply_markup: verifyKeyboard }
      );
    }

    // ===== NEW USER - Show verification =====
    const verifyKeyboard = {
      inline_keyboard: [
        [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
      ]
    };

    return bot.sendMessage(
      chatId,
      `⚠️ Wajib join 2 grup untuk akses`,
      { reply_markup: verifyKeyboard }
    );
  });

  // ===== CALLBACK: Verify Join Button =====
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (query.data === "verify_join") {
      await bot.answerCallbackQuery(query.id);

      // Check group membership
      const groupCheck = await bot.checkGroupMembership(userId);

      if (!groupCheck.verified) {
        // User belum join - kirim pesan dengan deep-link button SAJA
        const groupMainDeeplink = `https://t.me/agentviber12?join`;
        const groupCvDeeplink = `https://t.me/channelviber?join`;

        const joinKeyboard = {
          inline_keyboard: [
            [
              { text: "📱 @agentviber12", url: groupMainDeeplink }
            ],
            [
              { text: "📱 @channelviber", url: groupCvDeeplink }
            ],
            [{ text: "✅ Sudah Join", callback_data: "verify_again" }]
          ]
        };

        // Delete old message & send new one (minimal text, button only)
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.sendMessage(
            chatId,
            `⚠️ Wajib join 2 grup terlebih dahulu`,
            { reply_markup: joinKeyboard }
          );
        } catch (err) {
          console.error("Error di verify_join:", err);
        }
      } else {
        // User sudah join - delete message & proceed to dashboard
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.showDashboard(userId, chatId);
        } catch (err) {
          console.error("Error di verify_join (already joined):", err);
        }
      }
    }

    // ===== CALLBACK: Verify Join Button (dari /start) =====
    // Note: verify_again callback sudah di handle global di index.js
  });
}
